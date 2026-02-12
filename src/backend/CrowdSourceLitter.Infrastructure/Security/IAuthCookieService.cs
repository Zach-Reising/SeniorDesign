using System.Security;
using CrowdSourceLitter.Domain.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace CrowdSourceLitter.Infrastructure.Security
{
    public interface IAuthCookieService
    {
    
        public void SetAuthCookies(HttpResponse response, AuthResult result);

        public void ClearAuthCookies(HttpResponse response);
    }
}