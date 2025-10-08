from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.schemas.userSchema import SignUpRequest, SignUpResponse, SigninRequest, TokenResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import create_access_token, hash_password, verify_password

from app.db.database import get_db
from app.db.models import User
from app.db.crud import get_user_by_email

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)    

@router.post("/signup", response_model=SignUpResponse)
async def signup(request: SignUpRequest, db: AsyncSession = Depends(get_db)):
    existing_user = await get_user_by_email(db, request.email)
    if existing_user:
        raise HTTPException(status_code=409, detail = "Email already Registered")
    if request.password != request.retype_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    name = f"{request.first_name} {request.last_name}"
    hashed_password = hash_password(request.password)
    new_user = await User(email=request.email, password=hashed_password, name=name)
    db.add(new_user)
    await db.commit()
    access_token = create_access_token({"sub": new_user.email})
    await db.refresh(new_user)

    if new_user:
        print("User created successfully")
    return {"email": new_user.email, "token": access_token}

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    db_user = await get_user_by_email(db, form_data.username)
    print("Verified:", verify_password(form_data.password, db_user.password))  #type: ignore

    if not db_user or not verify_password(form_data.password, db_user.password):  #type: ignore
       raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    access_token = create_access_token({"sub": db_user.email})

    return { "access_token": access_token, "token_type": "bearer" }