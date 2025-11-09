from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests 
import os

from app.schemas.userSchema import SignUpRequest, SignUpResponse, TokenResponse
from app.core.security import create_access_token, hash_password, verify_password
from app.db.database import get_db
from app.db.models import User
from app.db.crud import get_user_by_email
from app.db.crud import create_user_if_not_exists  # ✅ we’ll add this small helper

from datetime import timedelta

ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 hour

router = APIRouter(prefix="/auth", tags=["Auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")  # ✅ Set this in your .env


# -----------------------------------------------
# 🧩 1️⃣ Normal Signup
# -----------------------------------------------
@router.post("/signup", response_model=SignUpResponse)
async def signup(request: SignUpRequest, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=409, detail="Email already Registered")
    if request.password != request.retype_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    name = f"{request.first_name} {request.last_name}"
    hashed_password = hash_password(request.password)
    new_user = User(email=request.email, password=hashed_password, name=name)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token({"sub": new_user.email, "name": name})
    return {"email": new_user.email, "token": access_token}


# -----------------------------------------------
# 🧩 2️⃣ Normal Login
# -----------------------------------------------
@router.post("/login", response_model=TokenResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    db_user = await get_user_by_email(db, form_data.username)
    if not db_user or not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token({"sub": db_user.email, "name": db_user.name})
    return {"access_token": access_token, "token_type": "bearer"}


# -----------------------------------------------
# 🧩 3️⃣ Google Login
# -----------------------------------------------

class GoogleToken(BaseModel):
    id_token: str

@router.post("/google")
async def google_login(payload: GoogleToken, db: AsyncSession = Depends(get_db)):
    try:
        # 1️⃣ Verify token
        idinfo = id_token.verify_oauth2_token(
            payload.id_token, requests.Request(), GOOGLE_CLIENT_ID
        )

        # 2️⃣ Extract info
        email = idinfo["email"]
        name = idinfo.get("name", email.split("@")[0])
        picture = idinfo.get("picture")

        # 3️⃣ Ensure user exists (create if not)
        user = await create_user_if_not_exists(db, email, name, picture)

        # 4️⃣ Generate your app’s JWT
        access_token = create_access_token(
            {"sub": email, "name": name, "picture": picture}
        )

        # ✅ Return token and user info
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {"name": name, "email": email, "picture": picture},
        }

    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    
    
# class GoogleLoginIn(BaseModel):
#     token: str


# @router.post("/google", response_model=TokenResponse)
# async def google_login(body: GoogleLoginIn, db: AsyncSession = Depends(get_db)):
#     """
#     Verify Google token, create user if needed, and return your app's JWT.
#     """

#     try:
#         # 1️⃣ Verify Google ID token
#         idinfo = id_token.verify_oauth2_token(
#             body.token,
#             google_requests.Request(),
#             GOOGLE_CLIENT_ID,
#         )
#     except Exception as e:
#         print("❌ Google token verification failed:", str(e))
#         raise HTTPException(status_code=400, detail="Invalid Google token")

#     # 2️⃣ Extract user info
#     email = idinfo.get("email")
#     name = idinfo.get("name") or email.split("@")[0]
#     picture = idinfo.get("picture")
#     email_verified = idinfo.get("email_verified", True)

#     if not email or not email_verified:
#         raise HTTPException(status_code=400, detail="Email not verified with Google")

#     # 3️⃣ Find or create user in DB
#     user = await get_user_by_email(db, email)
#     if not user:
#         # create a Google user without password
#         user = User(email=email, password=None, name=name)
#         db.add(user)
#         await db.commit()
#         await db.refresh(user)

#     # 4️⃣ Issue your app’s JWT (this is used for authorization)
#     access_token = create_access_token({"sub": user.email, "name": user.name})

#     return {
#         "access_token": access_token,
#         "token_type": "bearer",
#         "user": {
#             "id": user.id,
#             "name": user.name,
#             "email": user.email,
#             "picture": picture,
#         },
#     }
