using CrowdSourceLitter.Domain.Repositories;
using CrowdSourceLitter.Domain.Services;
using Microsoft.Extensions.Logging;

namespace CrowdSourceLitter.Application.Managers;

public class AuthManager : IAuthManager
{
    private readonly IAuthRepository _authRepository;
    private readonly ILogger<AuthManager> _logger;

    public AuthManager(IAuthRepository authRepository, ILogger<AuthManager> logger)
    {
        _authRepository = authRepository;
        _logger = logger;
    }

    public Task<AuthResult> LoginAsync(AuthRequest request)
    {
        return _authRepository.LoginAsync(request);
    }

    public Task<AuthResult> RegisterAsync(AuthRequest request)
    {
        return _authRepository.RegisterAsync(request);
    }
}