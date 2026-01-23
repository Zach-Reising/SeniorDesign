# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy everything (solution + project files) preserving structure
COPY . .

# Restore dependencies
RUN dotnet restore CrowdSourceLitter.sln

# Publish the project
WORKDIR /app/CrowdSourceLitter
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Expose port
EXPOSE 5000
ENV DOTNET_RUNNING_IN_CONTAINER=true
ENV DOTNET_URLS=http://+:5000

# Run the app
ENTRYPOINT ["dotnet", "CrowdSourceLitter.dll"]
