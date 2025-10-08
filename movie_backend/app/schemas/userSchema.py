from pydantic import BaseModel, EmailStr


class SignUpRequest(BaseModel):
    email: EmailStr
    password: str
    retype_password: str
    first_name: str
    last_name: str

class SignUpResponse(BaseModel):
    email: EmailStr
    token: str

class SigninRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
