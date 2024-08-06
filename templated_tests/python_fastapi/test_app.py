import pytest
from fastapi.testclient import TestClient
from app import app
from datetime import date

client = TestClient(app)

def test_root():
    """
    Test the root endpoint by sending a GET request to "/" and checking the response status code and JSON body.
    """
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the FastAPI application!"}



def test_echo():
    response = client.get("/echo/hello")
    assert response.status_code == 200
    assert response.json() == {"message": "hello"}


def test_days_until_new_year():
    response = client.get("/days-until-new-year")
    assert response.status_code == 200
    assert "days_until_new_year" in response.json()
    today = date.today()
    next_new_year = date(today.year + 1, 1, 1)
    delta = next_new_year - today
    assert response.json()["days_until_new_year"] == delta.days


def test_is_palindrome():
    response = client.get("/is-palindrome/racecar")
    assert response.status_code == 200
    assert response.json() == {"is_palindrome": True}

    response = client.get("/is-palindrome/hello")
    assert response.status_code == 200
    assert response.json() == {"is_palindrome": False}

def test_square():
    response = client.get("/square/5")
    assert response.status_code == 200
    assert response.json() == {"result": 25}


def test_divide():
    response = client.get("/divide/8/2")
    assert response.status_code == 200
    assert response.json() == {"result": 4.0}

    response = client.get("/divide/8/0")
    assert response.status_code == 400
    assert response.json() == {"detail": "Cannot divide by zero"}


def test_multiply():
    response = client.get("/multiply/3/4")
    assert response.status_code == 200
    assert response.json() == {"result": 12}


def test_subtract():
    response = client.get("/subtract/10/4")
    assert response.status_code == 200
    assert response.json() == {"result": 6}


def test_add():
    response = client.get("/add/3/4")
    assert response.status_code == 200
    assert response.json() == {"result": 7}


def test_current_date():
    response = client.get("/current-date")
    assert response.status_code == 200
    assert "date" in response.json()
    assert response.json()["date"] == date.today().isoformat()

