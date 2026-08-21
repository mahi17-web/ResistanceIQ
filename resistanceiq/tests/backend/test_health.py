def test_health_check(client):
    response = client.get("/api/v1/system/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["ONLINE", "DEGRADED"]
    assert data["database_connected"] is True
    assert "version" in data


def test_platform_info(client):
    response = client.get("/api/v1/system/info")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert "features" in data


def test_dashboard_summary(client):
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_projects" in data
    assert "total_forecasts" in data
    assert "avg_durability_score" in data
    assert "active_projects" in data


def test_list_targets_and_pests(client):
    targets_res = client.get("/api/v1/targets")
    assert targets_res.status_code == 200
    assert len(targets_res.json()) >= 1

    pests_res = client.get("/api/v1/pests")
    assert pests_res.status_code == 200
    assert len(pests_res.json()) >= 1


def test_backtest_summary(client):
    res = client.get("/api/v1/backtests")
    assert res.status_code == 200
    data = res.json()
    assert "mean_absolute_error" in data
    assert "cases" in data
