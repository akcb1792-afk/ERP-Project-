# Use the SDK image to build the application
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["GrowURBuisness.API.csproj", "./"]
RUN dotnet restore "./GrowURBuisness.API.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "GrowURBuisness.API.csproj" -c Release -o /app/publish

# Use the runtime image
FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Set the entry point for the container
ENTRYPOINT ["dotnet", "GrowURBuisness.API.dll"]
