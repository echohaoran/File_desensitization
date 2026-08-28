use candle_core::{DType, Device, Tensor};
use candle_transformers::{generation::LogitsProcessor, models::quantized_qwen2::ModelWeights};
use std::{fs::File, path::PathBuf};
use tokenizers::Tokenizer;

pub fn run_candidate_inference(model_path: &str, _rules: &str, _selected_text: &str) -> Result<String, String> {
    let model_path = PathBuf::from(model_path);
    let tokenizer_path = model_path.parent().unwrap_or_else(|| std::path::Path::new(".")).join("tokenizer.json");
    let tokenizer = Tokenizer::from_file(&tokenizer_path).map_err(|error| format!("缺少或无法读取 tokenizer.json：{error}"))?;
    let device = Device::Cpu;
    let mut file = File::open(&model_path).map_err(|error| format!("模型文件读取失败：{error}"))?;
    let content = candle_core::quantized::gguf_file::Content::read(&mut file).map_err(|error| format!("Candle GGUF 解析失败：{error:?}"))?;
    let mut model = ModelWeights::from_gguf(content, &mut file, &device).map_err(|error| format!("Qwen2 GGUF 架构不兼容：{error:?}"))?;
    let prompt = format!("你是敏感信息检测器，只输出 JSON。待检测文本：{}\n输出：{{\"items\":[]}}", _selected_text.chars().take(1200).collect::<String>());
    let encoding = tokenizer.encode(prompt, true).map_err(|error| format!("tokenizer 编码失败：{error}"))?;
    let mut ids = encoding.get_ids().to_vec();
    if ids.len() > 1400 { ids.truncate(1400); }
    let mut sampler = LogitsProcessor::new(42, None, None);
    let mut output = String::new();
    for index in 0..128 {
        let input = Tensor::new(ids.last().copied().unwrap_or(0), &device).map_err(|e| format!("输入张量失败：{e:?}"))?.reshape((1, 1)).map_err(|e| format!("输入形状失败：{e:?}"))?;
        let logits = model.forward(&input, ids.len().saturating_sub(1)).map_err(|e| format!("Candle 推理失败：{e:?}"))?;
        let logits = logits.squeeze(0).map_err(|e| format!("logits 形状失败：{e:?}"))?.to_dtype(DType::F32).map_err(|e| format!("logits 类型失败：{e:?}"))?;
        let next = sampler.sample(&logits).map_err(|e| format!("采样失败：{e:?}"))?;
        ids.push(next);
        let piece = tokenizer.decode(&[next], false).map_err(|error| format!("tokenizer 解码失败：{error}"))?;
        output.push_str(&piece);
        if output.contains("}") && output.contains("items") { break; }
        if index == 127 { break; }
    }
    Ok(output)
}
