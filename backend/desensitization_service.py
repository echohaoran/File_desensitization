"""
脱敏服务模块
集成 Microsoft Presidio 和中国百家姓库进行 PII 检测和脱敏
"""

import re
import json
from typing import List, Dict, Any, Tuple, Optional
from datetime import datetime

# Microsoft Presidio 相关导入
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig

# 中文分词
import jieba

# PDF 处理
import PyPDF2
import io

# Word 文档处理
from docx import Document

# Excel 处理
import pandas as pd

# 尝试导入 spacy，如果失败则使用备用方案
try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    print("警告：spacy 未安装，将使用备用的 Presidio 分析器")


class DesensitizationService:
    """脱敏服务类"""
    
    def __init__(self):
        """初始化脱敏服务"""
        # 初始化 Presidio 分析器
        self.analyzer = None
        self.anonymizer = None
        
        try:
            # 检查 spacy 模型是否可用
            import spacy
            try:
                spacy.load("en_core_web_sm")
                self.analyzer = AnalyzerEngine()
                self.anonymizer = AnonymizerEngine()
                print("✓ Presidio 分析器初始化成功")
            except OSError:
                print("警告：spacy 模型未安装，将仅使用正则表达式和百家姓库进行检测")
                print("提示：如需 Presidio 功能，请运行 'python -m spacy download en_core_web_sm'")
        except ImportError:
            print("警告：spacy 未安装，将仅使用正则表达式和百家姓库进行检测")
        
        # 中国百家姓（常见姓氏）
        self.chinese_surnames = self._load_chinese_surnames()
        
        # 敏感信息模式
        self.sensitive_patterns = self._load_sensitive_patterns()
        
        # 统计信息
        self.stats = {
            "total_detections": 0,
            "by_type": {}
        }
    
    def _load_chinese_surnames(self) -> set:
        """加载中国百家姓"""
        # 常见姓氏列表（前100个）
        common_surnames = {
            "赵", "钱", "孙", "李", "周", "吴", "郑", "王", "冯", "陈",
            "褚", "卫", "蒋", "沈", "韩", "杨", "朱", "秦", "尤", "许",
            "何", "吕", "施", "张", "孔", "曹", "严", "华", "金", "魏",
            "陶", "姜", "戚", "谢", "邹", "喻", "柏", "水", "窦", "章",
            "云", "苏", "潘", "葛", "奚", "范", "彭", "郎", "鲁", "韦",
            "昌", "马", "苗", "凤", "花", "方", "俞", "任", "袁", "柳",
            "酆", "鲍", "史", "唐", "费", "廉", "岑", "薛", "雷", "贺",
            "倪", "汤", "滕", "殷", "罗", "毕", "郝", "邬", "安", "常",
            "乐", "于", "时", "傅", "皮", "卞", "齐", "康", "伍", "余",
            "元", "卜", "顾", "孟", "平", "黄", "和", "穆", "萧", "尹",
            "姚", "邵", "湛", "汪", "祁", "毛", "禹", "狄", "米", "贝",
            "明", "臧", "计", "伏", "成", "戴", "谈", "宋", "茅", "庞",
            "熊", "纪", "舒", "屈", "项", "祝", "董", "梁", "杜", "阮",
            "蓝", "闵", "席", "季", "麻", "强", "贾", "路", "娄", "危",
            "江", "童", "颜", "郭", "梅", "盛", "林", "刁", "钟", "徐",
            "邱", "骆", "高", "夏", "蔡", "田", "樊", "胡", "凌", "霍",
            "虞", "万", "支", "柯", "昝", "管", "卢", "莫", "经", "房",
            "裘", "缪", "干", "解", "应", "宗", "丁", "宣", "贲", "邓",
            "郁", "单", "杭", "洪", "包", "诸", "左", "石", "崔", "吉",
            "钮", "龚", "程", "嵇", "邢", "滑", "裴", "陆", "荣", "翁",
            "荀", "羊", "於", "惠", "甄", "曲", "家", "封", "芮", "羿",
            "储", "靳", "汲", "邴", "糜", "松", "井", "段", "富", "巫",
            "乌", "焦", "巴", "弓", "牧", "隗", "山", "谷", "车", "侯",
            "宓", "蓬", "全", "郗", "班", "仰", "秋", "仲", "伊", "宫",
            "宁", "仇", "栾", "暴", "甘", "钭", "厉", "戎", "祖", "武",
            "符", "刘", "景", "詹", "束", "龙", "叶", "幸", "司", "韶",
            "郜", "黎", "蓟", "薄", "印", "宿", "白", "怀", "蒲", "邰",
            "从", "鄂", "索", "咸", "籍", "赖", "卓", "蔺", "屠", "蒙",
            "池", "乔", "阴", "郁", "胥", "能", "苍", "双", "闻", "莘",
            "党", "翟", "谭", "贡", "劳", "逄", "姬", "申", "扶", "堵",
            "冉", "宰", "郦", "雍", "却", "璩", "桑", "桂", "濮", "牛",
            "寿", "通", "边", "扈", "燕", "冀", "郏", "浦", "尚", "农",
            "温", "别", "庄", "晏", "柴", "瞿", "阎", "充", "慕", "连",
            "茹", "习", "宦", "艾", "鱼", "容", "向", "古", "易", "慎",
            "戈", "廖", "庾", "终", "暨", "居", "衡", "步", "都", "耿",
            "满", "弘", "匡", "国", "文", "寇", "广", "禄", "阙", "东",
            "殴", "殳", "沃", "利", "蔚", "越", "夔", "隆", "师", "巩",
            "厍", "聂", "晁", "勾", "敖", "融", "冷", "訾", "辛", "阚",
            "那", "简", "饶", "空", "曾", "毋", "沙", "乜", "养", "鞠",
            "须", "丰", "巢", "关", "蒯", "相", "查", "后", "荆", "红",
            "游", "竺", "权", "逯", "盖", "益", "桓", "公", "万俟", "司马",
            "上官", "欧阳", "夏侯", "诸葛", "闻人", "东方", "赫连", "皇甫",
            "尉迟", "公羊", "澹台", "公冶", "宗政", "濮阳", "淳于", "单于",
            "太叔", "申屠", "公孙", "仲孙", "轩辕", "令狐", "钟离", "宇文",
            "长孙", "慕容", "鲜于", "闾丘", "司徒", "司空", "亓官", "司寇",
            "仉", "督", "子车", "颛孙", "端木", "巫马", "公西", "漆雕",
            "乐正", "壤驷", "公良", "拓跋", "夹谷", "宰父", "谷梁", "段干",
            "百里", "东郭", "南门", "呼延", "归", "海", "羊舌", "微生",
            "岳", "帅", "缑", "亢", "况", "后", "有", "琴", "梁丘", "左丘",
            "东门", "西门", "商", "牟", "佘", "佴", "伯", "赏", "南宫",
            "墨", "哈", "谯", "笪", "年", "爱", "阳", "佟"
        }
        return common_surnames
    
    def _load_sensitive_patterns(self) -> Dict[str, re.Pattern]:
        """加载敏感信息正则模式"""
        return {
            # 手机号（中国大陆）
            "phone": re.compile(r'1[3-9]\d{9}'),
            
            # 身份证号（18位）
            "id_card": re.compile(r'\d{17}[\dXx]'),
            
            # 银行卡号（16-19位）
            "bank_card": re.compile(r'\d{16,19}'),
            
            # 邮箱地址
            "email": re.compile(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'),
            
            # 固定电话
            "landline": re.compile(r'(?:0\d{2,3}[-\s]?)?\d{7,8}'),
            
            # IP 地址
            "ip_address": re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b'),
            
            # 车牌号
            "license_plate": re.compile(r'[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤川青藏琼宁][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]'),
            
            # 护照号
            "passport": re.compile(r'[A-Z]\d{8}'),
            
            # 军官证
            "military_id": re.compile(r'[A-Za-z0-9]{6,10}'),
            
            # 统一社会信用代码
            "unified_social_credit_code": re.compile(r'[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}'),
            
            # 中文姓名（2-4个字，常见姓氏开头）
            "chinese_name": None,  # 需要特殊处理
            
            # 金额（万元、元等）
            "amount": re.compile(r'(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?\s*(?:万元|元|美元|USD|CNY|￥|\$)'),
        }
    
    def extract_text(self, content: bytes, file_ext: str) -> str:
        """
        从不同格式的文件中提取文本
        
        Args:
            content: 文件内容（字节）
            file_ext: 文件扩展名
            
        Returns:
            提取的文本内容
        """
        try:
            if file_ext in ['.txt', '.csv', '.json', '.md']:
                # 文本文件直接解码
                return content.decode('utf-8', errors='ignore')
            
            elif file_ext == '.pdf':
                # PDF 文件处理
                return self._extract_text_from_pdf(content)
            
            elif file_ext == '.docx':
                # Word 文档处理
                return self._extract_text_from_docx(content)
            
            elif file_ext in ['.xlsx', '.xls']:
                # Excel 文件处理
                return self._extract_text_from_excel(content, file_ext)
            
            else:
                return ""
                
        except Exception as e:
            print(f"提取文本时出错：{str(e)}")
            return ""
    
    def _extract_text_from_pdf(self, content: bytes) -> str:
        """从 PDF 提取文本"""
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            print(f"PDF 解析错误：{str(e)}")
            return ""
    
    def _extract_text_from_docx(self, content: bytes) -> str:
        """从 Word 文档提取文本"""
        try:
            doc = Document(io.BytesIO(content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text.strip()
        except Exception as e:
            print(f"Word 文档解析错误：{str(e)}")
            return ""
    
    def _extract_text_from_excel(self, content: bytes, file_ext: str) -> str:
        """从 Excel 提取文本"""
        try:
            if file_ext == '.xlsx':
                df = pd.read_excel(io.BytesIO(content), engine='openpyxl')
            else:
                df = pd.read_excel(io.BytesIO(content))
            
            # 将所有单元格内容转换为文本
            text = ""
            for col in df.columns:
                for cell in df[col]:
                    if pd.notna(cell):
                        text += str(cell) + "\n"
            return text.strip()
        except Exception as e:
            print(f"Excel 解析错误：{str(e)}")
            return ""
    
    def detect_sensitive_info(self, text: str) -> List[Dict[str, Any]]:
        """
        检测文本中的敏感信息
        
        Args:
            text: 要检测的文本
            
        Returns:
            检测到的敏感信息列表
        """
        detections = []
        
        # 1. 使用正则表达式检测
        regex_detections = self._detect_with_regex(text)
        detections.extend(regex_detections)
        
        # 2. 使用 Microsoft Presidio 检测（英文 PII）
        presidio_detections = self._detect_with_presidio(text)
        detections.extend(presidio_detections)
        
        # 3. 使用百家姓库检测中文姓名
        name_detections = self._detect_chinese_names(text)
        detections.extend(name_detections)
        
        # 去重和合并
        detections = self._merge_detections(detections)
        
        # 更新统计信息
        self.stats["total_detections"] = len(detections)
        self.stats["by_type"] = {}
        for det in detections:
            det_type = det["type"]
            self.stats["by_type"][det_type] = self.stats["by_type"].get(det_type, 0) + 1
        
        return detections
    
    def _detect_with_regex(self, text: str) -> List[Dict[str, Any]]:
        """使用正则表达式检测敏感信息"""
        detections = []
        
        for pattern_name, pattern in self.sensitive_patterns.items():
            if pattern is None:
                continue
            
            matches = pattern.finditer(text)
            for match in matches:
                detections.append({
                    "type": pattern_name,
                    "value": match.group(),
                    "start": match.start(),
                    "end": match.end(),
                    "confidence": 0.9,
                    "source": "regex"
                })
        
        return detections
    
    def _detect_with_presidio(self, text: str) -> List[Dict[str, Any]]:
        """使用 Microsoft Presidio 检测 PII"""
        detections = []
        
        if not self.analyzer:
            print("警告：Presidio 分析器不可用，跳过 Presidio 检测")
            return detections
        
        try:
            # 使用 Presidio 分析文本
            results = self.analyzer.analyze(
                text=text,
                language="en",
                entities=[
                    "PERSON", "EMAIL_ADDRESS", "PHONE_NUMBER",
                    "US_SSN", "CREDIT_CARD", "IP_ADDRESS",
                    "LOCATION", "DATE_TIME"
                ]
            )
            
            for result in results:
                # 映射 Presidio 实体类型到我们的类型
                type_mapping = {
                    "PERSON": "name",
                    "EMAIL_ADDRESS": "email",
                    "PHONE_NUMBER": "phone",
                    "US_SSN": "ssn",
                    "CREDIT_CARD": "bank_card",
                    "IP_ADDRESS": "ip_address",
                    "LOCATION": "address",
                    "DATE_TIME": "date"
                }
                
                detection_type = type_mapping.get(result.entity_type, "other")
                
                detections.append({
                    "type": detection_type,
                    "value": text[result.start:result.end],
                    "start": result.start,
                    "end": result.end,
                    "confidence": result.score,
                    "source": "presidio"
                })
                
        except Exception as e:
            print(f"Presidio 检测错误：{str(e)}")
        
        return detections
    
    def _detect_chinese_names(self, text: str) -> List[Dict[str, Any]]:
        """使用百家姓库检测中文姓名"""
        detections = []
        
        # 使用 jieba 分词
        words = jieba.cut(text)
        
        current_pos = 0
        for word in words:
            # 检查是否是中文姓名（2-4个字，以常见姓氏开头）
            if (len(word) >= 2 and len(word) <= 4 and 
                word[0] in self.chinese_surnames and
                all('\u4e00' <= c <= '\u9fff' for c in word)):
                
                # 查找在原文中的位置
                start = text.find(word, current_pos)
                if start != -1:
                    detections.append({
                        "type": "chinese_name",
                        "value": word,
                        "start": start,
                        "end": start + len(word),
                        "confidence": 0.8,
                        "source": "chinese_surnames"
                    })
                    current_pos = start + len(word)
        
        return detections
    
    def _merge_detections(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """合并重叠的检测结果"""
        if not detections:
            return []
        
        # 按位置排序
        detections.sort(key=lambda x: (x["start"], -x["end"]))
        
        merged = []
        current = detections[0]
        
        for next_det in detections[1:]:
            # 检查是否重叠
            if next_det["start"] < current["end"]:
                # 保留置信度更高的
                if next_det["confidence"] > current["confidence"]:
                    current = next_det
            else:
                merged.append(current)
                current = next_det
        
        merged.append(current)
        
        return merged
    
    def redact_text(self, text: str, user_id: str) -> Dict[str, Any]:
        """
        执行文本脱敏
        
        Args:
            text: 要脱敏的文本
            user_id: 用户标识
            
        Returns:
            脱敏结果，包含脱敏文本和映射表
        """
        # 检测敏感信息
        detections = self.detect_sensitive_info(text)
        
        # 创建映射表
        mappings = []
        redacted_text = text
        
        # 按位置从后往前替换，避免位置偏移
        for i, detection in enumerate(reversed(detections)):
            placeholder = f"[{detection['type'].upper()}_{i+1:03d}]"
            
            # 记录映射关系
            mappings.append({
                "id": i + 1,
                "placeholder": placeholder,
                "type": detection["type"],
                "original": detection["value"],
                "start": detection["start"],
                "end": detection["end"],
                "confidence": detection["confidence"],
                "source": detection["source"]
            })
            
            # 执行替换
            redacted_text = (
                redacted_text[:detection["start"]] + 
                placeholder + 
                redacted_text[detection["end"]:]
            )
        
        # 反转映射表（按位置从前到后）
        mappings.reverse()
        
        # 重新计算映射表中的位置（因为文本已被替换）
        # 注意：这里简化处理，实际应该记录原始位置
        
        return {
            "success": True,
            "redacted_text": redacted_text,
            "original_length": len(text),
            "redacted_length": len(redacted_text),
            "detection_count": len(detections),
            "mappings": mappings,
            "user_id": user_id,
            "created_at": datetime.now().isoformat(),
            "stats": self.stats
        }
    
    def restore_text(self, redacted_text: str, mapping_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        还原脱敏文本
        
        Args:
            redacted_text: 脱敏后的文本
            mapping_data: 映射表数据
            
        Returns:
            还原结果
        """
        mappings = mapping_data.get("mappings", [])
        
        restored_text = redacted_text
        
        # 按占位符长度从长到短排序，避免部分匹配
        sorted_mappings = sorted(mappings, key=lambda x: len(x["placeholder"]), reverse=True)
        
        for mapping in sorted_mappings:
            placeholder = mapping["placeholder"]
            original = mapping["original"]
            restored_text = restored_text.replace(placeholder, original)
        
        return {
            "success": True,
            "restored_text": restored_text,
            "redacted_length": len(redacted_text),
            "restored_length": len(restored_text),
            "mappings_applied": len(mappings),
            "user_id": mapping_data.get("user_id"),
            "created_at": datetime.now().isoformat()
        }
