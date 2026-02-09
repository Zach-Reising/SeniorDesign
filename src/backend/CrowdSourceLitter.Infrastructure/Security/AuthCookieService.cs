using System.Security;
using CrowdSourceLitter.Domain.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace CrowdSourceLitter.Infrastructure.Security
{
    public class AuthCookieService : IAuthCookieService
    {
        ILogger<AuthCookieService> _logger;

        public AuthCookieService(ILogger<AuthCookieService> logger)
        {
            _logger = logger;
        }

        public void SetAuthCookies(HttpResponse response, AuthResult result)
        {
            response.Cookies.Append(
                "access_token",
                result.AccessToken!,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddMinutes(30)
                }
            );
            _logger.LogInformation("Access token set");

            response.Cookies.Append(
                "refresh_token",
                result.RefreshToken!,
                new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTimeOffset.UtcNow.AddDays(7)
                }
            );
            _logger.LogInformation("Refresh Token Set");
        }

        public void ClearAuthCookies(HttpResponse response)
        {
            response.Cookies.Delete("access_token");
            response.Cookies.Delete("refresh_token");
        }
    }
}