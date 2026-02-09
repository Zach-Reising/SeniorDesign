using Supabase;
using Supabase.Gotrue;
using CrowdSourceLitter.Domain.Services;

namespace CrowdSourceLitter.Infrastructure.Providers.AuthenticationProviders
{
    
    public interface IAuthenticationProvider
    {
        public Supabase.Client? Client { get; }
        /// <summary>
        /// Signs a user into Supabase using the provided email and password.
        /// This method is used for user authentication and returns a session if successful
        /// </summary>
        /// <param name="request">A service object containing email and password</param>
        /// <returns>A session if successful null otherwise
        public Task<AuthResult> LoginAsync(AuthRequest request);


        /// <summary>
        /// Registers a user with Supabase
        /// </summary>
        /// <param name="request">A service object containing email and password</param>
        /// <returns>A session if successful null otherwise
        public Task<AuthResult> RegisterAsync(AuthRequest request);

        /// <summary>
        /// Signs a user out of Supabase
        /// </summary>
        public Task SignOut();

    }
}