from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class Year(BaseModel):  # 年を受け取るためのPydanticモデルを定義
    year: int

@app.post("/wareki")
def convert_to_wareki(year: Year):
    if year.year >= 2019:
        nengo = "令和"
        nengo_year = year.year - 2018
    elif year.year >= 1989:
        nengo = "平成"
        nengo_year = year.year - 1988
    elif year.year >= 1926:
        nengo = "昭和"
        nengo_year = year.year - 1925
    elif year.year >= 1912:
        nengo = "大正"
        nengo_year = year.year - 1911
    elif year.year >= 1868:
        nengo = "明治"
        nengo_year = year.year - 1867
    else:
        raise HTTPException(status_code=400, detail="明治以前の年は対応していません")

    return {"wareki": f"{nengo}{nengo_year}年"}