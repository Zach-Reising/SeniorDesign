using CrowdSourceLitter.Infrastructure.Settings;
using CrowdSourceLitter.Infrastructure.Providers.AuthenticationProviders;
using CrowdSourceLitter.Infrastructure.Repositories;
using CrowdSourceLitter.Infrastructure.Security;
using CrowdSourceLitter.Domain.Repositories;
using CrowdSourceLitter.Domain.Services;
using CrowdSourceLitter.Application.Managers;
using DotNetEnv;

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

            // --- Add API Services ---
            builder.Services.AddControllers();
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Used for backend debugging
            builder.Services.AddLogging();

            // Add memory cache
            builder.Services.AddMemoryCache();

            // Register HTTP Client Factory for API Calls
            builder.Services.AddHttpClient();

            // --- For Dependency Injection ---
            // Register Providers
            builder.Services.AddScoped<IAuthenticationProvider, AuthenticationProvider>();

            // Regist Repositories
            builder.Services.AddScoped<IAuthRepository, AuthRepository>();

            // Register Services
            builder.Services.AddScoped<IAuthCookieService, AuthCookieService>();

            // Register Managers
            builder.Services.AddScoped<IAuthManager, AuthManager>();

            // Configure Cookie Authentication
            builder.Services.AddAuthentication("Cookies")
                .AddCookie("Cookies", options =>
                {
                    options.Cookie.Name = "csl_auth";
                    options.Cookie.HttpOnly = true;
                    options.Cookie.SameSite = SameSiteMode.Lax;

                    if (builder.Environment.IsDevelopment())
                    {
                        options.Cookie.SecurePolicy = CookieSecurePolicy.None;
                    }

                    options.SlidingExpiration = true;
                    options.ExpireTimeSpan = TimeSpan.FromDays(7);

                    options.LoginPath = "/auth/login";
                    options.AccessDeniedPath = "/auth/forbidden";
                });

            // Add Authorization Servicdes
            builder.Services.AddAuthorization();


            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Frontend",
                    policy =>
                    {
                        policy
                            .WithOrigins(
                                "http://localhost:8100",
                                "http://localhost:5173"
                            )
                            .AllowAnyHeader()
                            .AllowAnyMethod()
                            .AllowCredentials();
                    });
            });

            var app = builder.Build();

            // Configure Any Helpers

            // --- Configure Http Request Pipeline
            if (!app.Environment.IsDevelopment())
            {
                app.UseExceptionHandler("/error");
                app.UseHsts();
            }
            else
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseRouting();


            app.UseCors("Frontend");
            app.UseAuthentication();
            app.UseAuthorization();

            
            app.MapControllers();
            
            app.Run();
        }
    }
}