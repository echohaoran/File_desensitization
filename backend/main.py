"""
多步骤脱敏系统 - Python 后端服务
使用 FastAPI 提供文件脱敏 API
集成 Microsoft Presidio 和中国百家姓库进行 PII 检测
"""

import os
import json
import uuid
import tempfile
from typing import List, Dict, Any, Optional
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse

from desensitization_service import DesensitizationService

app = FastAPI(
    title="多步骤脱敏系统 API",
    description="面向企业内部投资人员与私募基金管理员的敏感数据脱敏工具",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化脱敏服务
desensitization_service = DesensitizationService()

# 用户上传文件存储目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    """API 根路径"""
    return {
        "message": "多步骤脱敏系统 API",
        "version": "1.0.0",
        "endpoints": {
            "/api/redact": "POST - 上传文件并执行初步脱敏",
            "/api/detect": "POST - 仅检测敏感信息（不脱敏）",
            "/api/health": "GET - 健康检查"
        }
    }


@app.get("/api/health")
async def health_check():
    """健康检查接口"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.post("/api/pdf-to-word")
async def convert_pdf_to_word(file: UploadFile = File(...)):
    """
    将 PDF 文件转换为 Word 文档（保留格式）
    
    处理流程：
    1. 接收用户上传的 PDF 文件
    2. 使用 pdf2docx 将 PDF 转换为 Word
    3. 返回转换后的 Word 文件
    
    参数：
    - file: 上传的 PDF 文件
    
    返回：
    - 转换后的 Word 文件（.docx）
    """
    try:
        # 验证文件类型
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext != '.pdf':
            raise HTTPException(
                status_code=400,
                detail="仅支持 PDF 文件格式"
            )
        
        # 读取文件内容
        content = await file.read()
        
        # 创建临时文件保存上传的 PDF
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
            temp_pdf.write(content)
            temp_pdf_path = temp_pdf.name
        
        # 创建临时文件保存转换后的 Word
        temp_docx_path = temp_pdf_path.replace('.pdf', '.docx')
        
        try:
            # 使用 pdf2docx 进行转换
            from pdf2docx import Converter
            
            cv = Converter(temp_pdf_path)
            cv.convert(temp_docx_path)
            cv.close()
            
            # 读取转换后的 Word 文件
            with open(temp_docx_path, 'rb') as f:
                docx_content = f.read()
            
            # 生成输出文件名
            output_filename = file.filename.replace('.pdf', '.docx')
            
            # 返回 Word 文件
            return FileResponse(
                path=temp_docx_path,
                filename=output_filename,
                media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            )
            
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"PDF 转换失败：{str(e)}"
            )
        finally:
            # 清理临时文件
            if os.path.exists(temp_pdf_path):
                os.unlink(temp_pdf_path)
            # 注意：temp_docx_path 会被 FileResponse 使用，不需要在这里删除
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错：{str(e)}")


@app.post("/api/redact-with-conversion")
async def redact_file_with_conversion(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    上传文件并执行初步脱敏（支持 PDF 自动转换为 Word）
    
    处理流程：
    1. 接收用户上传的文件
    2. 如果是 PDF，先转换为 Word 格式（保留格式）
    3. 提取文件文本内容
    4. 使用 Microsoft Presidio 和中国百家姓库检测 PII
    5. 执行初步脱敏（替换为占位符）
    6. 返回脱敏后的文本、映射表和转换后的 Word 文件
    
    参数：
    - file: 上传的文件
    - user_id: 用户标识（用于数据隔离）
    
    返回：
    - 脱敏后的文本
    - 映射表（占位符 -> 原始值）
    - 检测到的敏感信息统计
    - 转换后的 Word 文件（如果是 PDF）
    """
    try:
        # 验证文件类型
        allowed_extensions = {'.txt', '.csv', '.json', '.md', '.pdf', '.docx', '.xlsx', '.xls'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式：{file_ext}。支持的格式：{', '.join(allowed_extensions)}"
            )
        
        # 读取文件内容
        content = await file.read()
        
        # 如果是 PDF，先转换为 Word
        converted_docx_path = None
        if file_ext == '.pdf':
            try:
                # 创建临时文件保存上传的 PDF
                with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_pdf:
                    temp_pdf.write(content)
                    temp_pdf_path = temp_pdf.name
                
                # 创建临时文件保存转换后的 Word
                converted_docx_path = temp_pdf_path.replace('.pdf', '.docx')
                
                # 使用 pdf2docx 进行转换
                from pdf2docx import Converter
                
                cv = Converter(temp_pdf_path)
                cv.convert(converted_docx_path)
                cv.close()
                
                # 读取转换后的 Word 文件内容
                with open(converted_docx_path, 'rb') as f:
                    docx_content = f.read()
                
                # 使用 Word 文件进行后续处理
                content = docx_content
                file_ext = '.docx'
                
                # 清理临时 PDF 文件
                os.unlink(temp_pdf_path)
                
            except Exception as e:
                # 如果转换失败，继续使用原始 PDF 处理
                print(f"PDF 转换警告：{str(e)}")
        
        # 根据文件类型提取文本
        text_content = desensitization_service.extract_text(content, file_ext)
        
        if not text_content:
            raise HTTPException(
                status_code=400,
                detail="无法从文件中提取文本内容"
            )
        
        # 执行脱敏
        result = desensitization_service.redact_text(text_content, user_id)
        
        # 保存脱敏结果（可选）
        task_id = str(uuid.uuid4())
        result["task_id"] = task_id
        result["original_filename"] = file.filename
        result["file_type"] = file_ext
        result["converted_from_pdf"] = file_ext == '.docx' and file.filename.lower().endswith('.pdf')
        
        # 保存到用户目录（可选）
        user_dir = os.path.join(UPLOAD_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)
        
        # 保存原始文件
        original_path = os.path.join(user_dir, f"{task_id}_original{file_ext}")
        with open(original_path, "wb") as f:
            f.write(content)
        
        # 保存脱敏结果
        result_path = os.path.join(user_dir, f"{task_id}_result.json")
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        # 如果有转换后的 Word 文件，保存它
        if converted_docx_path and os.path.exists(converted_docx_path):
            converted_path = os.path.join(user_dir, f"{task_id}_converted.docx")
            with open(converted_docx_path, 'rb') as src, open(converted_path, 'wb') as dst:
                dst.write(src.read())
            result["converted_docx_path"] = converted_path
            # 清理临时文件
            os.unlink(converted_docx_path)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错：{str(e)}")


@app.post("/api/detect")
async def detect_sensitive_content(file: UploadFile = File(...)):
    """
    检测文件中的敏感信息（不执行脱敏）
    
    支持的文件格式：
    - 文本文件：TXT, CSV, JSON, MD
    - PDF 文件
    - Word 文档：DOCX
    - Excel 文件：XLSX, XLS
    
    返回：
    - 检测到的敏感信息列表
    - 敏感信息类型（姓名、手机号、身份证、银行卡等）
    - 位置信息（行号、列号、偏移量）
    """
    try:
        # 验证文件类型
        allowed_extensions = {'.txt', '.csv', '.json', '.md', '.pdf', '.docx', '.xlsx', '.xls'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式：{file_ext}。支持的格式：{', '.join(allowed_extensions)}"
            )
        
        # 读取文件内容
        content = await file.read()
        
        # 根据文件类型提取文本
        text_content = desensitization_service.extract_text(content, file_ext)
        
        if not text_content:
            raise HTTPException(
                status_code=400,
                detail="无法从文件中提取文本内容"
            )
        
        # 检测敏感信息
        detections = desensitization_service.detect_sensitive_info(text_content)
        
        return {
            "success": True,
            "filename": file.filename,
            "file_type": file_ext,
            "text_length": len(text_content),
            "detections": detections,
            "detection_count": len(detections)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错：{str(e)}")


@app.post("/api/redact")
async def redact_file(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    上传文件并执行初步脱敏
    
    处理流程：
    1. 接收用户上传的文件
    2. 提取文件文本内容
    3. 使用 Microsoft Presidio 和中国百家姓库检测 PII
    4. 执行初步脱敏（替换为占位符）
    5. 返回脱敏后的文本和映射表
    
    参数：
    - file: 上传的文件
    - user_id: 用户标识（用于数据隔离）
    
    返回：
    - 脱敏后的文本
    - 映射表（占位符 -> 原始值）
    - 检测到的敏感信息统计
    """
    try:
        # 验证文件类型
        allowed_extensions = {'.txt', '.csv', '.json', '.md', '.pdf', '.docx', '.xlsx', '.xls'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"不支持的文件格式：{file_ext}。支持的格式：{', '.join(allowed_extensions)}"
            )
        
        # 读取文件内容
        content = await file.read()
        
        # 根据文件类型提取文本
        text_content = desensitization_service.extract_text(content, file_ext)
        
        if not text_content:
            raise HTTPException(
                status_code=400,
                detail="无法从文件中提取文本内容"
            )
        
        # 执行脱敏
        result = desensitization_service.redact_text(text_content, user_id)
        
        # 保存脱敏结果（可选）
        task_id = str(uuid.uuid4())
        result["task_id"] = task_id
        result["original_filename"] = file.filename
        result["file_type"] = file_ext
        
        # 保存到用户目录（可选）
        user_dir = os.path.join(UPLOAD_DIR, user_id)
        os.makedirs(user_dir, exist_ok=True)
        
        # 保存原始文件
        original_path = os.path.join(user_dir, f"{task_id}_original{file_ext}")
        with open(original_path, "wb") as f:
            f.write(content)
        
        # 保存脱敏结果
        result_path = os.path.join(user_dir, f"{task_id}_result.json")
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件时出错：{str(e)}")


@app.post("/api/restore")
async def restore_file(
    redacted_file: UploadFile = File(...),
    mapping_file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    还原脱敏文件
    
    处理流程：
    1. 接收脱敏文件和映射表
    2. 验证映射表用户归属
    3. 根据映射表还原原始内容
    4. 返回还原后的文件
    
    参数：
    - redacted_file: 脱敏后的文件
    - mapping_file: 映射表 JSON 文件
    - user_id: 用户标识（用于验证归属）
    
    返回：
    - 还原后的文本
    - 还原统计信息
    """
    try:
        # 读取映射表
        mapping_content = await mapping_file.read()
        mapping_data = json.loads(mapping_content)
        
        # 验证用户归属
        if mapping_data.get("user_id") != user_id:
            raise HTTPException(
                status_code=403,
                detail="映射表用户归属不一致，无法还原"
            )
        
        # 读取脱敏文件
        redacted_content = await redacted_file.read()
        file_ext = os.path.splitext(redacted_file.filename)[1].lower()
        
        # 提取文本
        redacted_text = desensitization_service.extract_text(redacted_content, file_ext)
        
        if not redacted_text:
            raise HTTPException(
                status_code=400,
                detail="无法从脱敏文件中提取文本内容"
            )
        
        # 执行还原
        result = desensitization_service.restore_text(redacted_text, mapping_data)
        
        return result
        
    except HTTPException:
        raise
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="映射表文件格式错误，请上传有效的 JSON 文件")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"还原文件时出错：{str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
