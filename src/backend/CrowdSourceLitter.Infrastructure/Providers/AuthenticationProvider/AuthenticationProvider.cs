using System.IO.Pipelines;
using System.Security.Cryptography.X509Certificates;
using CrowdSourceLitter.Domain.Services;
using CrowdSourceLitter.Infrastructure.Settings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.VisualBasic;
using Supabase;
using Supabase.Gotrue;
using Supabase.Gotrue.Exceptions;

namespace CrowdSourceLitter.Infrastructure.Providers.AuthenticationProviders;

public class AuthenticationProvider : IAuthenticationProvider
{
    public Supabase.Client? Client { get; }
    private readonly ILogger<AuthenticationProvider> _logger;

    private readonly SupabaseSettings _settings;


    public AuthenticationProvider(IOptions<SupabaseSettings> settings, ILogger<AuthenticationProvider> logger)
    {
        _logger = logger;
        _settings = settings.Value;

        // Define Supabase Options
        var options = new SupabaseOptions
        {
            AutoRefreshToken = true,
            AutoConnectRealtime = true
        };

        // Validate Configurations
        if (string.IsNullOrEmpty(_settings.Url) || string.IsNullOrEmpty(_settings.AnonKey))
        {
            _logger.LogCritical("Supabase URL and/or Anon Key are not configured. Supabase features will be disabled.");
            Client = null;
        }
        else
        {
            _logger.LogInformation("Initializing Supabase CLient for URL: {SupabaseUrl}", _settings.Url);

            // Initialize the Supabase client and assign it to the public property
            try
            {
                Client = new Supabase.Client(_settings.Url, _settings.AnonKey, options);

                if (Client == null)
                {
                    _logger.LogError("Supabase client Initialization failed. Client is null");
                    throw new InvalidOperationException("Supabase client initialization failed.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to initialize Supabase client.");
                Client = null; 
            }
        }
    }

    public async Task<AuthResult> LoginAsync(AuthRequest request)
    {
        if (Client == null)
        {
            _logger.LogError("Supabase client is not initialized. Cannot Sign in.");
            throw new InvalidOperationException("Supabase client is not initialized for Login.");
        }

        try
        {        
            var result = await Client.Auth.SignIn(request.Email, request.Password);

            if (result?.RefreshToken is null) _logger.LogError("Refresh Token is null");
            if (result?.AccessToken is null) _logger.LogError("Access Token is null");

            return result is not null
                ? AuthResult.Success(result.AccessToken!, result.RefreshToken!)
                : AuthResult.Failure(AuthFailureReason.ExternalProviderError);
        }
        catch (GotrueException ex)
        {
            _logger.LogError("GoTrue Exception during LoginAsyncs");
            // Invalid Credentials
            try
            {
                var errorObj = System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, object>>(ex.Message);
                if (errorObj != null && errorObj.ContainsKey("msg"))
                {
                    _logger.LogError("Incorrect username or password during Login");
                    return AuthResult.Failure(AuthFailureReason.InvalidCredentials);
                }
                
                return AuthResult.Failure(AuthFailureReason.InvalidCredentials);
            }
            catch (Exception)
            {
                _logger.LogError("Exception occurred during LoginAsync");
                return AuthResult.Failure(AuthFailureReason.ExternalProviderError);
            }
        }
    }

    public async Task<AuthResult> RegisterAsync(AuthRequest request)
    {
        if (Client == null)
        {
            _logger.LogError("Supabase client is not initialized. Cannot Sign in.");
            throw new InvalidOperationException("Supabase client is not initialized for Login.");
        }
        try
        {
            var result = await Client.Auth.SignUp(request.Email, request.Password);

            if (result is null)
            {
                return AuthResult.Failure(AuthFailureReason.ExternalProviderError);
            }

            return result.User is not null
                ? AuthResult.Success(result.AccessToken!, result.RefreshToken!)
                : AuthResult.Failure(AuthFailureReason.ExternalProviderError);
        }
        catch (GotrueException ex)
        {
            _logger.LogError(ex.Message);
            // Invalid Credentials
            if (ex.StatusCode == 429)
            {
                return AuthResult.Failure(AuthFailureReason.EmailRateLimited);
            }
            return AuthResult.Failure(AuthFailureReason.ExternalProviderError);
        }
    }

    public Task SignOut()
    {
        if (Client?.Auth == null)
        {
            _logger.LogError("Supabase client or Auth is not initialized cannot sign out");
            return Task.CompletedTask;
        }

        return Client.Auth.SignOut();
    }
}