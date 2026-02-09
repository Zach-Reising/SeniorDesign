using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using CrowdSourceLitter.Application.DTO.AuthDTO;
using CrowdSourceLitter.Application.Managers;
using CrowdSourceLitter.Domain.Services;
using CrowdSourceLitter.Infrastructure.Security;
using Microsoft.AspNetCore.Authorization;

namespace CrowdSourceLitter.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthManager _authManager;
    private readonly IAuthCookieService _authCookieService;
    private readonly ILogger<AuthController> _logger;
    public AuthController(IAuthManager authManager, IAuthCookieService authCookieService, ILogger<AuthController> logger)
    {
        _authManager = authManager;
        _authCookieService = authCookieService;
        _logger = logger;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        var result = await _authManager.LoginAsync(
            new AuthRequest(dto.Email, dto.Password)
        );
        
        if (!result.IsSuccess)
        {
            _logger.LogInformation("Login Failed returning reason");
            return result.FailureReason switch
            {
                AuthFailureReason.InvalidCredentials => Unauthorized("Invalid email or password"),

                AuthFailureReason.EmailNotConfirmed => Unauthorized("Please Confrim your email before logging in"),

                _ => StatusCode(500, "Authentication Service Unavailable"),
            };
        }

        _logger.LogInformation("Setting Cookies");
        _authCookieService.SetAuthCookies(Response, result);

        _logger.LogInformation("Cookies Set returning result");
        return Ok(new { success = true });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] LoginRequestDto dto)
    {
        var result = await _authManager.RegisterAsync(
            new AuthRequest(dto.Email, dto.Password)
        );

        if (!result.IsSuccess)
        {
            return result.FailureReason switch
            {
                AuthFailureReason.EmailRateLimited => StatusCode(429, "Too many requests. Please try again later."),

                _ => StatusCode(500, "Registration Service Unavailable"),
            };
        }

        return Ok(new { message = "Please verify email before signing in"});
    }

    [HttpPost("logout")]
    public IActionResult Logout()
    {
        _authCookieService.ClearAuthCookies(Response);
        return Ok();
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        return Ok(new { authenticated = true });
    }
}