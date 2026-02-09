using System.IO.Pipelines;
using CrowdSourceLitter.Domain.Repositories;
using CrowdSourceLitter.Domain.Services;
using CrowdSourceLitter.Infrastructure.Providers.AuthenticationProviders;
using Microsoft.Extensions.Logging;

namespace CrowdSourceLitter.Infrastructure.Repositories;

public class AuthRepository : IAuthRepository
{
    private readonly IAuthenticationProvider _authProvider;
    private readonly ILogger<AuthRepository> _logger;

    public AuthRepository(IAuthenticationProvider authProvider, ILogger<AuthRepository> logger)
    {
        _authProvider = authProvider;

        _logger = logger;
    }

    public async Task<AuthResult> LoginAsync(AuthRequest request)
    {
        var result = await _authProvider.LoginAsync(request);

        if (!result.IsSuccess)
        {
            return result;
        }

        if (result.AccessToken == null || result.RefreshToken == null)
        {
            _logger.LogError("Either Access or refresh token is null");
            return AuthResult.Failure(AuthFailureReason.ExternalProviderError);
        }

        return result;
    }

    public async Task<AuthResult> RegisterAsync(AuthRequest request)
    {
        // For our Sign Ups Users must verify their email before logging in
        return await _authProvider.RegisterAsync(request);      
    }
}