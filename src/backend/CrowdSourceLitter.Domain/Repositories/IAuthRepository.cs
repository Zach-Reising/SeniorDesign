using CrowdSourceLitter.Domain.Services;

namespace CrowdSourceLitter.Domain.Repositories;

public interface IAuthRepository
{
    Task<AuthResult> LoginAsync(AuthRequest request);
    Task<AuthResult> RegisterAsync(AuthRequest request);
}