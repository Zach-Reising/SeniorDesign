using CrowdSourceLitter.Domain.Services;

namespace CrowdSourceLitter.Application.Managers
{
    public interface IAuthManager
    {
        public Task<AuthResult> LoginAsync(AuthRequest request);
        public Task<AuthResult> RegisterAsync(AuthRequest request);
    }
}