from fastapi import FastAPI

app = FastAPI(title="boookntalk API")

@app.get("/")
def read_root():
    return {"message": "Welcome to boookntalk API"}