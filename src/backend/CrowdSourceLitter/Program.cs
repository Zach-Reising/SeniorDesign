using CrowdSourceLitter.Infrastructure.Settings;
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

            // Register Services

            // Register Managers

            // Configure Cookie Authentication
            builder.Services.AddAuthentication();

            // Add Authorization Servicdes
            builder.Services.AddAuthorization();


            builder.Services.AddCors(options =>
            {
                options.AddPolicy("Ionic",
                    policy =>
                    {
                        policy
                            .WithOrigins(
                                "http://localhost:8100",
                                "http://localhost:5173"
                            )
                            .AllowAnyHeader()
                            .AllowAnyMethod();
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


            app.UseCors("Ionic");
            app.UseAuthentication();
            app.UseAuthorization();

            
            app.MapControllers();
            
            app.Run();
        }
    }
}