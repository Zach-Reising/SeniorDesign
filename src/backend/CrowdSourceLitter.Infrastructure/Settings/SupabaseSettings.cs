namespace CrowdSourceLitter.Infrastructure.Settings
{
    public class SupabaseSettings
    {
        public required string AnonKey { get; set; } = string.Empty;

        public required string Url { get; set; } = string.Empty;
        
        public required string ServiceKey { get; set; } = string.Empty;

    }
}