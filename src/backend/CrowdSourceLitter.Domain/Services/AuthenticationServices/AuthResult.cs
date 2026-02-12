namespace CrowdSourceLitter.Domain.Services;

public enum AuthFailureReason
{
    InvalidCredentials,
    EmailNotConfirmed,
    ExternalProviderError,
    EmailRateLimited
}

public record AuthResult(
    bool IsSuccess,
    string? AccessToken,
    string? RefreshToken,
    AuthFailureReason? FailureReason
)
{
    public static AuthResult Success(string accessToken, string refreshToken)
        => new(true, accessToken, refreshToken, null);

    public static AuthResult Failure(AuthFailureReason reason)
        => new(false, null, null, reason);
}