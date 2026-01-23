using CrowdSourceLitter.Infrastructure.Settings;
using DotNetEnv;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.DataProtection;

namespace CrowdSourceLitter
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Load configuration based on environment
            if (builder.Environment.IsDevelopment() && File.Exists(".env"))
            {
                Env.Load(".env");
            }
            builder.Configuration.AddEnvironmentVariables();

            // Bind Keys to strongly typed Settings class
            builder.Services.Configure<SupabaseSettings>(builder.Configuration.GetSection("SupabaseSettings"));

            // --- Add services to the container ---
            builder.Services.AddControllersWithViews();

            // Used for backend debugging
            builder.Services.AddLogging();

            // Add memory cache
            builder.Services.AddMemoryCache();

            // Register HTTP Client Factory for API Calls
            builder.Services.AddHttpClient();

            // --- For Dependency Injection ---
            // Register Providers

            // Register Services

            // Register Managers

            // Configure Cookie Authentication
            builder.Services.AddAuthentication(Microsoft.AspNetCore.Authentication.Cookies.CookieAuthenticationDefaults.AuthenticationScheme)
                .AddCookie(options =>
                {
                    options.LoginPath = "/Auth/Login";
                    options.LogoutPath = "/Auth/Logout";
                    options.ExpireTimeSpan = TimeSpan.FromHours(1);
                    options.SlidingExpiration = true;
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;
                    options.Cookie.SameSite = SameSiteMode.Strict;
                });

            // Add Authorization Servicdes
            builder.Services.AddAuthorization();

            // Add Session State Configuration
            builder.Services.AddDistributedMemoryCache();
            builder.Services.AddSession(options =>
            {
                options.IdleTimeout = TimeSpan.FromMinutes(30);
                options.Cookie.IsEssential = true;
                options.Cookie.HttpOnly = true;
                options.Cookie.SecurePolicy = builder.Environment.IsDevelopment() ? CookieSecurePolicy.None : CookieSecurePolicy.Always;
                options.Cookie.SameSite = SameSiteMode.Strict;
            });

            // Configure persistent data protection keys
            if (builder.Environment.IsProduction())
            {
                builder.Services.AddDataProtection()
                    .PersistKeysToFileSystem(new DirectoryInfo("/Home/dataprotection"))
                    .SetApplicationName("CrowdSourceLitterApp");
            }

            var app = builder.Build();

            // Configure Any Helpers

            // --- Configure Http Request Pipeline
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/Home/Error");
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            // Add Session Middleware
            app.UseSession();

            app.UseAuthentication();
            app.UseAuthorization();

            //TODO: This mapping needs to be updated
            // Map the Default Contoller route
            app.MapControllerRoute(
                name: "default",
                pattern: "{controller=Home}/{action=Index}");
            
            app.Run();
        }
    }
}