use candle_core::{DType, Device, Tensor};
use candle_transformers::{generation::LogitsProcessor, models::quantized_qwen2::ModelWeights};
use std::{fs::File, path::PathBuf};

fn generate(model_path: &str, prompt: String, max_tokens: usize, stop_when: impl Fn(&str) -> bool) -> Result<String, String> {
    let model_path = PathBuf::from(model_path);
    let tokenizer_path = model_path.parent().unwrap_or_else(|| std::path::Path::new(".")).join("tokenizer.json");
    let tokenizer = Tokenizer::from_file(&tokenizer_path).map_err(|error| format!("缺少或无法读取 tokenizer.json：{error}"))?;
    let device = Device::Cpu;
    let mut file = File::open(&model_path).map_err(|error| format!("模型文件读取失败：{error}"))?;
    let content = candle_core::quantized::gguf_file::Content::read(&mut file).map_err(|error| format!("Candle GGUF 解析失败：{error:?}"))?;
    let mut model = ModelWeights::from_gguf(content, &mut file, &device).map_err(|error| format!("Qwen2 GGUF 架构不兼容：{error:?}"))?;
    // Keep the tokenizer's configured Qwen special-token post processor while
    // passing the explicit chat template below.
    let encoding = tokenizer.encode(prompt, true).map_err(|error| format!("tokenizer 编码失败：{error}"))?;
    let mut ids = encoding.get_ids().to_vec();
    if ids.len() > 1_400 { ids.truncate(1_400); }
    let mut sampler = LogitsProcessor::new(42, None, None);
    let mut output = String::new();
    for _ in 0..max_tokens {
        let input = Tensor::new(ids.last().copied().unwrap_or(0), &device).map_err(|e| format!("输入张量失败：{e:?}"))?.reshape((1, 1)).map_err(|e| format!("输入形状失败：{e:?}"))?;
        let logits = model.forward(&input, ids.len().saturating_sub(1)).map_err(|e| format!("Candle 推理失败：{e:?}"))?;
        let logits = logits.squeeze(0).map_err(|e| format!("logits 形状失败：{e:?}"))?.to_dtype(DType::F32).map_err(|e| format!("logits 类型失败：{e:?}"))?;
        let next = sampler.sample(&logits).map_err(|e| format!("采样失败：{e:?}"))?;
        ids.push(next);
        let piece = tokenizer.decode(&[next], false).map_err(|error| format!("tokenizer 解码失败：{error}"))?;
        output.push_str(&piece);
        if stop_when(&output) { break; }
    }
    Ok(output)
}

fn qwen_chat_prompt(system: &str, user: &str) -> String {
    format!(
        "<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{user}<|im_end|>\n<|im_start|>assistant\n"
    )
}
use tokenizers::Tokenizer;

pub fn run_candidate_inference(model_path: &str, rules: &str, selected_text: &str) -> Result<String, String> {
    let prompt = qwen_chat_prompt(
        "你是敏感信息检测器。只返回用户要求的 JSON，不解释、不使用 Markdown。",
        &format!("请依据敏感规则识别待检测文本中的敏感片段。items 数组中的每项必须包含 text、start、end、type、confidence；start 和 end 是待检测文本的字符索引，end 不包含。没有结果才输出空数组。\n敏感规则：{}\n待检测文本：{}\n输出 JSON：", rules.chars().take(6000).collect::<String>(), selected_text.chars().take(1200).collect::<String>()),
    );
    generate(model_path, prompt, 128, |output| output.contains("}") && output.contains("items"))
}

pub fn run_regex_conversion(model_path: &str, rules: &[crate::commands::AiRegexSourceRule]) -> Result<String, String> {
    let rules_json = serde_json::to_string(rules).map_err(|_| "规则序列化失败".to_string())?;
    let prompt = qwen_chat_prompt(
        "你是 JavaScript 正则表达式专家。严格按用户指定 JSON schema 输出，不输出解释、Markdown 或代码围栏。",
        &format!(
            "根据每个敏感字段的名称、类型和当前匹配说明，生成可用于 JavaScript RegExp 的精确候选正则。输出格式只能是 {{\"items\":[{{\"id\":\"原始id\",\"regex\":\"无分隔符的正则\",\"confidence\":0.0}}]}}。仅输出有把握的项目；不要返回 /.../ 分隔符；不要输出换行；不要用 .+ 或 .* 这类过宽模式。待转换规则：{}\n输出 JSON：",
            rules_json.chars().take(7_000).collect::<String>()
        ),
    );
    generate(model_path, prompt, 320, |output| output.contains("}") && output.contains("items"))
}
