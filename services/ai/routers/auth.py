from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from .services.auth_service import AuthService

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest):
    token = await AuthService.authenticate_user(data.email, data.password)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": token}


@router.get("/me")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = await AuthService.get_current_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user
