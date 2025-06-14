#!/usr/bin/env python3
import asyncio
import aiohttp
import json
from datetime import datetime

async def test_backend_health():
    """Comprehensive backend health check"""
    base_url = "http://localhost:8001"
    results = {
        "timestamp": datetime.utcnow().isoformat(),
        "tests": [],
        "overall_status": "HEALTHY"
    }
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Basic health endpoint
        try:
            async with session.get(f"{base_url}/health") as resp:
                data = await resp.json()
                results["tests"].append({
                    "name": "Health Check",
                    "status": "PASS" if resp.status == 200 else "FAIL",
                    "response_code": resp.status,
                    "message": data.get("message", "")
                })
        except Exception as e:
            results["tests"].append({
                "name": "Health Check",
                "status": "FAIL",
                "error": str(e)
            })
            results["overall_status"] = "UNHEALTHY"
        
        # Test 2: API health endpoint
        try:
            async with session.get(f"{base_url}/api/health") as resp:
                data = await resp.json()
                results["tests"].append({
                    "name": "API Health Check",
                    "status": "PASS" if resp.status == 200 else "FAIL",
                    "response_code": resp.status,
                    "message": data.get("message", "")
                })
        except Exception as e:
            results["tests"].append({
                "name": "API Health Check",
                "status": "FAIL",
                "error": str(e)
            })
            results["overall_status"] = "UNHEALTHY"
        
        # Test 3: States endpoint
        try:
            async with session.get(f"{base_url}/api/states") as resp:
                data = await resp.json()
                states_count = len(data.get("states", []))
                results["tests"].append({
                    "name": "States Endpoint",
                    "status": "PASS" if resp.status == 200 and states_count == 58 else "FAIL",
                    "response_code": resp.status,
                    "states_count": states_count
                })
        except Exception as e:
            results["tests"].append({
                "name": "States Endpoint",
                "status": "FAIL",
                "error": str(e)
            })
            results["overall_status"] = "UNHEALTHY"
        
        # Test 4: Driving schools endpoint
        try:
            async with session.get(f"{base_url}/api/driving-schools") as resp:
                data = await resp.json()
                schools_count = len(data.get("schools", []))
                results["tests"].append({
                    "name": "Driving Schools Endpoint",
                    "status": "PASS" if resp.status == 200 else "FAIL",
                    "response_code": resp.status,
                    "schools_count": schools_count
                })
        except Exception as e:
            results["tests"].append({
                "name": "Driving Schools Endpoint",
                "status": "FAIL",
                "error": str(e)
            })
            results["overall_status"] = "UNHEALTHY"
        
        # Test 5: Registration endpoint (with dummy data)
        try:
            form_data = aiohttp.FormData()
            form_data.add_field('email', f'test{datetime.utcnow().timestamp()}@example.com')
            form_data.add_field('password', 'testpass123')
            form_data.add_field('first_name', 'Test')
            form_data.add_field('last_name', 'User')
            form_data.add_field('phone', '0555000000')
            form_data.add_field('address', 'Test Address')
            form_data.add_field('date_of_birth', '1990-01-01')
            form_data.add_field('gender', 'male')
            form_data.add_field('state', 'Alger')
            
            async with session.post(f"{base_url}/api/auth/register", data=form_data) as resp:
                data = await resp.json()
                results["tests"].append({
                    "name": "Registration Endpoint",
                    "status": "PASS" if resp.status == 200 else "FAIL",
                    "response_code": resp.status,
                    "has_token": "access_token" in data
                })
        except Exception as e:
            results["tests"].append({
                "name": "Registration Endpoint",
                "status": "FAIL",
                "error": str(e)
            })
            results["overall_status"] = "UNHEALTHY"
        
        # Test 6: CORS headers
        try:
            headers = {
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
                "Access-Control-Request-Headers": "Content-Type"
            }
            async with session.options(f"{base_url}/api/driving-schools", headers=headers) as resp:
                cors_headers = {k: v for k, v in resp.headers.items() if k.lower().startswith('access-control')}
                results["tests"].append({
                    "name": "CORS Configuration",
                    "status": "PASS" if resp.status == 200 else "FAIL",
                    "response_code": resp.status,
                    "cors_headers": cors_headers
                })
        except Exception as e:
            results["tests"].append({
                "name": "CORS Configuration",
                "status": "FAIL",
                "error": str(e)
            })
    
    return results

async def main():
    print("🚀 Starting Backend Health Check...")
    print("=" * 50)
    
    results = await test_backend_health()
    
    # Print results
    for test in results["tests"]:
        status_emoji = "✅" if test["status"] == "PASS" else "❌"
        print(f"{status_emoji} {test['name']}: {test['status']}")
        if "error" in test:
            print(f"   Error: {test['error']}")
        elif "response_code" in test:
            print(f"   Response Code: {test['response_code']}")
    
    print("=" * 50)
    overall_emoji = "🎉" if results["overall_status"] == "HEALTHY" else "🚨"
    print(f"{overall_emoji} Overall Status: {results['overall_status']}")
    
    # Save detailed results
    with open('/tmp/backend_health_check.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"📄 Detailed results saved to: /tmp/backend_health_check.json")

if __name__ == "__main__":
    asyncio.run(main())