import httpx

from api.schemas.orm.connection import EndpointConfig


class RESTConnector:
    def __init__(self, timeout: float = 15.0):
        self.timeout = timeout

    async def authenticate(
        self, base_url: str, auth_type: str, credentials: dict
    ) -> str | None:
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            if auth_type == "jwt_password":
                # OAuth2 form-based login (like track app)
                resp = await client.post(
                    f"{base_url}/api/auth/login",
                    data={
                        "username": credentials.get("username", ""),
                        "password": credentials.get("password", ""),
                    },
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
                resp.raise_for_status()
                return resp.json().get("access_token")

            elif auth_type == "jwt_json":
                # JSON body login
                resp = await client.post(
                    f"{base_url}/api/auth/login",
                    json=credentials,
                )
                resp.raise_for_status()
                return resp.json().get("access_token")

            elif auth_type == "api_key":
                # API key doesn't need auth call, just return the key
                return credentials.get("api_key")

            return None

    async def test_connection(self, base_url: str, token: str | None = None) -> bool:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.get(f"{base_url}/api/health", headers=headers)
                return resp.status_code == 200
            except httpx.HTTPError:
                return False

    async def fetch_endpoint(
        self,
        base_url: str,
        token: str | None,
        endpoint: EndpointConfig,
    ) -> dict:
        headers = {}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            url = f"{base_url}{endpoint.path}"
            resp = await client.request(endpoint.method, url, headers=headers)
            resp.raise_for_status()
            return {
                "name": endpoint.name,
                "label": endpoint.dashboard_label or endpoint.name,
                "data": resp.json(),
            }

    async def fetch_all(
        self,
        base_url: str,
        token: str | None,
        endpoints: list[EndpointConfig],
    ) -> list[dict]:
        results = []
        for endpoint in endpoints:
            try:
                result = await self.fetch_endpoint(base_url, token, endpoint)
                results.append(result)
            except Exception as e:
                results.append({
                    "name": endpoint.name,
                    "label": endpoint.dashboard_label or endpoint.name,
                    "data": None,
                    "error": str(e),
                })
        return results
