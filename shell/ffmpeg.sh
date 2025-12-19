#!/bin/bash

# 支持的视频文件扩展名
video_extensions=("mp4" "avi" "mkv" "mov" "wmv" "flv" "webm" "m4v" "3gp" "mpg" "mpeg" "ts" "mts" "m2ts")

# FFmpeg 参数配置()
output="ffmpeg"
crf="21"
preset="medium"
video_codec="libx265"
max_resolution="" # 最大分辨率限制，例如 2560
audio_codec="copy"
# 其他参数
ffmpeg_options="-y -hide_banner -err_detect ignore_err -threads 0"

# 默认筛选阈值（主菜单快速入口用）
# 支持格式: 100M, 1.5G, 500(字节)，也兼容 100MB/1.5GB
DEFAULT_GT_SIZE="300M"

# Excel 日志文件和路径配置
csv_log_file=""
target_path=""
is_single_file=false
base_backup_dir=""

# FFmpeg 模板配置
declare -A ffmpeg_templates
current_template_name=""

# 定义预设模板
init_templates() {
    # "ffmpeg_" 开头的目录会被排除在搜索之外
    # 模板格式: "模板名称|视频编码器|CRF值|编码预设|最大分辨率"
    # 输出目录自动生成为: ffmpeg_视频编码器-CRF值-编码预设[-分辨率]
    # 序号会自动生成，只需要按顺序添加模板即可
    local template_list=(
        "H265 2K Medium-21|libx265|21|medium|2560"
        "H265 Medium-21|libx265|21|medium"
        "H265 Slow-23|libx265|23|slow"
    )
    
    # 自动生成序号
    local index=1
    for template in "${template_list[@]}"; do
        ffmpeg_templates["$index"]="$template"
        ((index++))
    done
}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 通用的用户输入函数（支持默认值）
# 参数: $1 = 默认值（可选，默认为 "1"）
# 
# 用法示例: 
#   choice=$(read_with_default)           # 默认值为 "1"，用户按回车时自动选择选项1
#   choice=$(read_with_default "2")       # 默认值为 "2"，用户按回车时自动选择选项2
#   input=$(read_with_default "")         # 无默认值，用户必须输入内容
#
# 实际应用:
#   echo -ne "请选择 [1-3]: "
#   choice=$(read_with_default)           # 用户直接按回车时自动选择 "1"
#
#   echo -ne "请输入文件名: "
#   filename=$(read_with_default "")      # 用户必须输入，不能为空
read_with_default() {
    local default_value="${1:-1}"  # 如果没有传参数，默认值为 "1"
    local user_input
    read -r user_input
    
    # 如果用户没有输入且设置了默认值，则使用默认值
    if [[ -z "$user_input" && -n "$default_value" ]]; then
        echo "$default_value"
    else
        echo "$user_input"
    fi
}

# 创建Excel日志文件
create_csv_log() {
    local timestamp=$(date +"%Y%m%d_%H-%M")
    
    # 根据模板参数生成日志文件名（与输出目录命名逻辑一致）
    local log_name="ffmpeg_${video_codec}-${crf}-${preset}"
    # 如果设定了分辨率参数，则添加到末尾
    [[ -n "$max_resolution" ]] && log_name="${log_name}-${max_resolution}"
    # 添加时间戳
    log_name="${log_name}_${timestamp}"
    
    csv_log_file="${log_name}.xls"
    
    # 创建Excel文件并写入表头（使用制表符分隔）
    echo -e "耗时\t原文件大小(M)\t压制后大小(M)\t原分辨率\t压制分辨率\t模板\t文件名" > "$csv_log_file"
    
    echo -e "${GREEN}✓ 已创建日志文件: ${CYAN}$csv_log_file${NC}"
}

# 记录压制信息到Excel
log_to_csv() {
    local duration="$1"
    local original_size_mb="$2"
    local output_size_mb="$3"
    local original_resolution="$4"
    local output_resolution="$5"
    local template_name="$6"
    local filename="$7"
    
    if [[ -n "$csv_log_file" ]]; then
        echo -e "${duration}\t${original_size_mb}\t${output_size_mb}\t${original_resolution}\t${output_resolution}\t${template_name}\t${filename}" >> "$csv_log_file"
    fi
}

# 显示FFmpeg模板选择菜单
show_template_menu() {
    echo -e "${CYAN}=== FFmpeg 转换模板选择 ===${NC}"
    echo
    for key in $(printf '%s\n' "${!ffmpeg_templates[@]}" | sort -n); do
        IFS='|' read -r name codec crf_val preset_val max_res <<< "${ffmpeg_templates[$key]}"
        local res_display="${max_res:-自适应}"
        # 自动生成输出目录名称用于预览
        local auto_output="ffmpeg_${codec}-${crf_val}-${preset_val}"
        [[ -n "$max_res" ]] && auto_output="${auto_output}-${max_res}"
        printf "%2s. %-25s | 编码: %-8s | CRF: %-2s | 预设: %-10s | 分辨率: %-8s | 输出: %s\n" \
               "$key" "$name" "$codec" "$crf_val" "$preset_val" "$res_display" "$auto_output"
    done
    echo
    echo -ne "${BLUE}请选择模板 [1-${#ffmpeg_templates[@]}]: ${NC}"
}

# 选择并应用FFmpeg模板
select_template() {
    show_template_menu
    template_choice=$(read_with_default)
    
    echo
    
    if [[ -z "$template_choice" ]]; then
        echo -e "${YELLOW}⚠ 未选择模板，使用默认设置${NC}"
        return 0
    fi
    
    if [[ -n "${ffmpeg_templates[$template_choice]}" ]]; then
        IFS='|' read -r template_name video_codec crf preset max_resolution <<< "${ffmpeg_templates[$template_choice]}"
        
        # 保存当前模板名称到全局变量
        current_template_name="$template_name"
        
        # 自动生成输出目录名称
        local output_suffix="ffmpeg_${video_codec}-${crf}-${preset}"
        # 如果设定了分辨率参数，则添加到末尾
        [[ -n "$max_resolution" ]] && output_suffix="${output_suffix}-${max_resolution}"
        
        echo -e "${GREEN}✓ 已选择模板: ${YELLOW}$template_name${NC}"
        echo
        echo -e "${CYAN}参数配置:${NC}"
        echo -e "  ${BLUE}•${NC} 视频编码:   ${YELLOW}$video_codec${NC}"
        echo -e "  ${BLUE}•${NC} CRF值:      ${YELLOW}$crf${NC}"
        echo -e "  ${BLUE}•${NC} 编码预设:   ${YELLOW}$preset${NC}"
        echo -e "  ${BLUE}•${NC} 最大分辨率: ${YELLOW}${max_resolution:-自适应}${NC}"
        echo -e "  ${BLUE}•${NC} 输出目录:   ${YELLOW}$output_suffix${NC}"
        echo
        
        # 更新输出目录
        output="$output_suffix"
        mkdir -p "./$output"
        
        return 0
    else
        echo -e "${RED}✗ 无效的模板选择: $template_choice${NC}"
        echo -e "${YELLOW}⚠ 使用默认设置${NC}"
        echo
        return 1
    fi
}

# 检查是否是视频文件
is_video_file() {
    local file="$1"
    local extension="${file##*.}"
    local extension_lower="${extension,,}"
    
    for ext in "${video_extensions[@]}"; do
        if [[ "$extension_lower" == "$ext" ]]; then
            return 0
        fi
    done
    return 1
}

# 获取指定目录下所有视频文件（递归）
get_video_files_recursive() {
    local search_path="$1"
    local video_files=()
    
    # 使用 find 排除以 ffmpeg_ 开头的目录，只查找文件
    while IFS= read -r -d '' file; do
        if is_video_file "$file"; then
            video_files+=("$file")
        fi
    done < <(find "$search_path" -type d -name "ffmpeg_*" -prune -o -type f ! -name ".*" -print0 2>/dev/null)
    
    # 只输出非空的视频文件列表
    for file in "${video_files[@]}"; do
        [[ -n "$file" ]] && echo "$file"
    done
}

# 获取当前目录下所有视频文件（非递归）
get_video_files() {
    local video_files=()
    shopt -s nullglob  # 如果没有匹配，返回空而不是字面值
    for file in *; do
        [[ -f "$file" ]] || continue
        if is_video_file "$file"; then
            video_files+=("$file")
        fi
    done
    shopt -u nullglob  # 恢复默认行为
    printf '%s\n' "${video_files[@]}"
}

# 格式化文件大小显示
format_size() {
    local size=$1
    if (( size >= 1073741824 )); then
        printf "%.2f GB" "$(awk "BEGIN {printf \"%.2f\", $size / 1073741824}")"
    elif (( size >= 1048576 )); then
        printf "%.2f MB" "$(awk "BEGIN {printf \"%.2f\", $size / 1048576}")"
    elif (( size >= 1024 )); then
        printf "%.2f KB" "$(awk "BEGIN {printf \"%.2f\", $size / 1024}")"
    else
        printf "%d B" "$size"
    fi
}

# 解析大小输入（支持G/g, M/m）
parse_size() {
    local input="$1"
    local normalized

    # 兼容 300MB/1.5GB 这种输入
    normalized="${input// /}"
    if [[ "$normalized" =~ ^([0-9]+\.?[0-9]*)([GMgm])B$ ]]; then
        normalized="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
    fi

    if [[ "$normalized" =~ ^([0-9]+\.?[0-9]*)([GMgm]?)$ ]]; then
        local number="${BASH_REMATCH[1]}"
        local unit="${BASH_REMATCH[2],,}"

        case "$unit" in
            "g") echo "$(awk "BEGIN {printf \"%.0f\", $number * 1073741824}")" ;;
            "m") echo "$(awk "BEGIN {printf \"%.0f\", $number * 1048576}")" ;;
            "") echo "$(awk "BEGIN {printf \"%.0f\", $number}")" ;;
            *) echo "-1" ;;
        esac
    else
        echo "-1"
    fi
}

normalize_size_label() {
    local label="$1"
    label="${label// /}"
    label="${label^^}"
    # 兼容 300MB/1.5GB 这种后缀
    if [[ "$label" =~ ^([0-9]+\.?[0-9]*)(M|G)B$ ]]; then
        label="${BASH_REMATCH[1]}${BASH_REMATCH[2]}"
    fi
    echo "$label"
}

# 列出视频文件
list_video_files() {
    local files=()
    readarray -t files < <(get_video_files)
    
    # 过滤掉空字符串
    local valid_files=()
    for file in "${files[@]}"; do
        if [[ -n "$file" && -f "$file" ]]; then
            valid_files+=("$file")
        fi
    done
    
    if [[ ${#valid_files[@]} -eq 0 ]]; then
        echo -e "${RED}未找到任何视频文件！${NC}"
        return 1
    fi
    
    echo -e "${BLUE}=== 视频文件列表 ===${NC}"
    for i in "${!valid_files[@]}"; do
        local file="${valid_files[$i]}"
        local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        local formatted_size=$(format_size "$size")
        printf "%3d. %-50s %s\n" $((i+1)) "$file" "$formatted_size"
    done
    echo
}

# 解析用户输入的序号
parse_indices() {
    local input="$1"
    local max_index="$2"
    local indices=()
    local ADDR
    
    # 替换逗号为空格，然后分割
    input="${input//,/ }"
    read -ra ADDR <<< "$input"
    
    for i in "${ADDR[@]}"; do
        if [[ "$i" =~ ^[0-9]+$ ]] && (( i >= 1 && i <= max_index )); then
            indices+=("$i")
        else
            echo -e "${RED}无效序号: $i${NC}"
            return 1
        fi
    done
    
    printf '%s\n' "${indices[@]}"
}

# 获取视频分辨率
get_video_resolution() {
    local file="$1"
    
    # 使用 ffprobe 获取视频宽度和高度
    local width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$file" 2>/dev/null)
    local height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$file" 2>/dev/null)
    
    # 检查是否成功获取分辨率
    if [[ -z "$width" ]] || [[ -z "$height" ]]; then
        echo ""
        return 1
    fi
    
    echo "${width}x${height}"
}

# 获取视频分辨率并构建缩放参数
get_scale_filter() {
    local file="$1"
    local max_res="$2"
    
    # 如果没有设置最大分辨率，返回空
    [[ -z "$max_res" ]] && return 0
    
    # 使用 ffprobe 获取视频宽度和高度
    local width=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$file" 2>/dev/null)
    local height=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$file" 2>/dev/null)
    
    # 检查是否成功获取分辨率
    if [[ -z "$width" ]] || [[ -z "$height" ]]; then
        echo ""
        return 1
    fi
    
    # 判断是否需要缩放
    local scale_filter=""
    
    if (( width > max_res )); then
        # 宽度超过限制，按宽度缩放，高度自适应（保持偶数）
        scale_filter="scale=${max_res}:-2"
        echo -e "  ${YELLOW}检测到宽度 ${width}px 超过限制 ${max_res}px，将缩放到 ${max_res}px（高度自适应）${NC}" >&2
    elif (( height > max_res )); then
        # 高度超过限制，按高度缩放，宽度自适应（保持偶数）
        scale_filter="scale=-2:${max_res}"
        echo -e "  ${YELLOW}检测到高度 ${height}px 超过限制 ${max_res}px，将缩放到 ${max_res}px（宽度自适应）${NC}" >&2
    else
        # 宽度和高度都在限制内，不需要缩放
        echo -e "  ${GREEN}当前分辨率 ${width}x${height} 在限制内，无需缩放${NC}" >&2
        echo ""
        return 0
    fi
    
    echo "$scale_filter"
}

# 根据大小和比较符生成目录名前缀
generate_filter_dir_prefix() {
    local size_bytes="$1"
    local operator="$2"  # "GT" 或 "LT"
    local label="${3:-}"

    local size_display
    if [[ -n "$label" ]]; then
        size_display="$(normalize_size_label "$label")"
    else
        size_display="$(format_size "$size_bytes")"
        size_display="${size_display// /}"
    fi

    if [[ "$operator" == "GT" ]]; then
        echo "ffmpeg_GT_${size_display}"
    elif [[ "$operator" == "LT" ]]; then
        echo "ffmpeg_LT_${size_display}"
    else
        echo "ffmpeg_filter_${size_display}"
    fi
}

# 批量移动文件到指定前缀的目录下（保留源目录结构）
move_files_to_filter_dir() {
    local dir_prefix="$1"
    shift
    local files=("$@")
    
    if [[ ${#files[@]} -eq 0 ]]; then
        return 0
    fi
    
    echo -e "${CYAN}▸ 将源文件移动到筛选目录...${NC}"
    echo
    
    for file in "${files[@]}"; do
        local file_dir=$(dirname "$file")
        local file_base=$(basename "$file")
        
        # 确定目标根目录
        local filter_root
        if [[ "$is_single_file" == true ]]; then
            # 单文件模式：在文件所在目录
            filter_root="${file_dir}/${dir_prefix}"
        elif [[ -n "$base_backup_dir" ]]; then
            # 路径参数模式：在父目录
            local original_parent=$(dirname "$target_path")
            filter_root="${original_parent}/${dir_prefix}"
        else
            # 交互模式：在工作目录
            filter_root="./${dir_prefix}"
        fi
        
        # 计算源文件相对路径
        local relative_path
        if [[ "$is_single_file" == true ]]; then
            relative_path="$file_base"
        elif [[ -n "$target_path" ]]; then
            relative_path="${file#$target_path/}"
            if [[ "$relative_path" == "$file" ]]; then
                relative_path="$file_base"
            fi
        else
            relative_path="$file"
            relative_path="${relative_path#./}"
        fi
        
        # 构建目标路径（保留源目录结构）
        local target_dir="${filter_root}"
        local relative_dir=$(dirname "$relative_path")
        
        if [[ "$relative_dir" != "." ]]; then
            target_dir="${filter_root}/${relative_dir}"
        fi
        
        # 创建目录并移动文件
        mkdir -p "$target_dir"
        local target_file="${target_dir}/${file_base}"
        
        if mv "$file" "$target_file" 2>/dev/null; then
            printf "  ${GREEN}✓${NC} %-60s ${CYAN}→ %s${NC}\n" "$file" "$target_file"
        else
            printf "  ${RED}✗${NC} 无法移动: %s\n" "$file"
        fi
    done
    
    echo
}

# 移动已处理的源文件到备份目录
move_processed_file() {
    local file="$1"
    local file_dir=$(dirname "$file")
    local file_base=$(basename "$file")
    
    # 确定备份目录的根路径
    local backup_root
    if [[ "$is_single_file" == true ]]; then
        # 单文件模式：在文件所在目录创建 ffmpeg_source
        backup_root="${file_dir}/ffmpeg_source"
    elif [[ -n "$base_backup_dir" ]]; then
        # 路径参数模式：在父目录创建 ffmpeg_source
        local original_parent=$(dirname "$target_path")
        backup_root="${original_parent}/ffmpeg_source"
    else
        # 交互模式：在工作目录创建 ffmpeg_source
        backup_root="./ffmpeg_source"
    fi
    
    # 计算源文件相对于工作路径的相对路径
    local relative_path
    if [[ "$is_single_file" == true ]]; then
        relative_path="$file_base"
    elif [[ -n "$target_path" ]]; then
        # 去除 target_path 前缀获得相对路径
        relative_path="${file#$target_path/}"
        # 如果文件就在 target_path 根目录，则只保留文件名
        if [[ "$relative_path" == "$file" ]]; then
            relative_path="$file_base"
        fi
    else
        # 交互模式：使用相对路径
        relative_path="$file"
        # 如果以 ./ 开头，去掉
        relative_path="${relative_path#./}"
    fi
    
    # 构建目标路径
    local target_backup_dir="${backup_root}"
    local relative_dir=$(dirname "$relative_path")
    
    if [[ "$relative_dir" != "." ]]; then
        target_backup_dir="${backup_root}/${relative_dir}"
    fi
    
    # 创建目标目录
    mkdir -p "$target_backup_dir"
    
    # 移动文件
    local target_backup_file="${target_backup_dir}/${file_base}"
    
    if mv "$file" "$target_backup_file"; then
        echo -e "  ${GREEN}→ 源文件已移动到: $target_backup_file${NC}"
    else
        echo -e "  ${YELLOW}⚠ 无法移动源文件: $file${NC}"
    fi
}

# 处理单个视频文件
process_video() {
    local file="$1"
    local current_index="$2"  # 当前处理的视频序号（可选）
    local total_count="$3"    # 总视频数量（可选）
    
    local file_dir=$(dirname "$file")
    local file_base=$(basename "$file")
    local filename="${file_base%.*}"
    local file_ext="${file_base##*.}"
    
    # 显示进度信息（如果提供了序号和总数）
    if [[ -n "$current_index" ]] && [[ -n "$total_count" ]]; then
        echo -e "${GREEN}[${current_index}/${total_count}]${NC} ${YELLOW}正在处理: $file${NC}"
    else
        echo -e "${YELLOW}正在处理: $file${NC}"
    fi
    
    # 确定输出路径
    local output_file
    if [[ "$is_single_file" == true ]]; then
        # 单文件模式：在同路径下，文件名加 _ffmpeg
        output_file="${file_dir}/${filename}_ffmpeg.mp4"
    elif [[ -n "$base_backup_dir" ]]; then
        # 路径参数的目录模式：创建备份目录结构
        local relative_path="${file#$target_path/}"
        local relative_dir=$(dirname "$relative_path")
        local output_dir="${base_backup_dir}"
        
        if [[ "$relative_dir" != "." ]]; then
            output_dir="${base_backup_dir}/${relative_dir}"
        fi
        
        mkdir -p "$output_dir"
        output_file="${output_dir}/${filename}.mp4"
    else
        # 交互模式：在当前目录下创建输出目录，保持子目录结构
        local file_relative_dir=$(dirname "$file")
        local output_dir
        
        if [[ "$file_relative_dir" == "." ]]; then
            # 当前目录的文件
            output_dir="./$output"
        else
            # 子目录的文件，保持目录结构
            output_dir="./$output/$file_relative_dir"
        fi
        
        mkdir -p "$output_dir"
        output_file="${output_dir}/${filename}.mp4"
    fi
    
    echo "  输出到: $output_file"
    
    # 获取原始分辨率
    local original_resolution=$(get_video_resolution "$file")
    if [[ -z "$original_resolution" ]]; then
        original_resolution="未知"
    fi
    
    # 显示原始分辨率信息
    echo -e "  ${CYAN}原始分辨率: ${GREEN}${original_resolution}${NC}"
    
    # 获取缩放滤镜参数
    local scale_filter=""
    local output_resolution="-"
    if [[ -n "$max_resolution" ]]; then
        scale_filter=$(get_scale_filter "$file" "$max_resolution")
        # 如果有缩放，标记输出分辨率为缩放后的值
        if [[ -n "$scale_filter" ]]; then
            output_resolution="缩放"
        fi
    fi
    
    # 记录开始时间
    local start_time=$(date +%s)
    
    # 构建ffmpeg命令
    local cmd="ffmpeg $ffmpeg_options -fflags +discardcorrupt+genpts -i \"$file\" -vcodec \"$video_codec\""
    
    # 只添加非空参数
    [[ -n "$preset" ]] && cmd+=" -preset \"$preset\""
    [[ -n "$crf" ]] && cmd+=" -crf \"$crf\""
    
    # 添加缩放滤镜
    [[ -n "$scale_filter" ]] && cmd+=" -vf \"$scale_filter\""
    
    [[ -n "$audio_codec" ]] && cmd+=" -acodec \"$audio_codec\""
    
    cmd+=" \"$output_file\" -y"
    
    # 执行ffmpeg命令
    if eval "$cmd"; then
        # 计算耗时
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        local duration_formatted=$(printf "%02d:%02d:%02d" $((duration/3600)) $((duration%3600/60)) $((duration%60)))
        
        echo -e "${GREEN}✓ 成功处理: $file (耗时: ${duration_formatted})${NC}"
        
        # 显示输出文件信息
        if [[ -f "$output_file" ]]; then
            local original_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
            local output_size=$(stat -c%s "$output_file" 2>/dev/null || echo "0")
            
            # 获取输出文件的实际分辨率
            local actual_output_resolution=$(get_video_resolution "$output_file")
            if [[ -z "$actual_output_resolution" ]]; then
                actual_output_resolution="-"
            elif [[ "$actual_output_resolution" == "$original_resolution" ]]; then
                # 如果分辨率没有改变，记录为"-"
                actual_output_resolution="-"
            fi
            
            if (( original_size > 0 && output_size > 0 )); then
                local original_formatted=$(format_size "$original_size")
                local output_formatted=$(format_size "$output_size")
                local compression_ratio=$(awk "BEGIN {printf \"%.1f\", ($original_size - $output_size) * 100 / $original_size}")
                echo -e "  ${CYAN}原始大小: $original_formatted → 输出大小: $output_formatted (压缩 ${compression_ratio}%)${NC}"
                
                # 记录到Excel文件
                local original_size_mb=$(awk "BEGIN {printf \"%.2f\", $original_size / 1048576}")
                local output_size_mb=$(awk "BEGIN {printf \"%.2f\", $output_size / 1048576}")
                local template_display="${current_template_name:-默认}"
                log_to_csv "$duration_formatted" "$original_size_mb" "$output_size_mb" "$original_resolution" "$actual_output_resolution" "$template_display" "$file"
            fi
            
            # 移动已处理的源文件到备份目录
            move_processed_file "$file"
        fi
    else
        echo -e "${RED}✗ 处理失败: $file${NC}"
    fi
    echo -e "${BLUE}─────────────────────────────────────${NC}"
}

# 按序号选择处理文件
process_by_indices() {
    local files=()
    readarray -t files < <(get_video_files_recursive ".")
    
    # 过滤掉空字符串
    local valid_files=()
    for file in "${files[@]}"; do
        if [[ -n "$file" && -f "$file" ]]; then
            valid_files+=("$file")
        fi
    done
    files=("${valid_files[@]}")
    
    if [[ ${#files[@]} -eq 0 ]]; then
        echo -e "${RED}✗ 未找到任何视频文件！${NC}"
        return 1
    fi
    
    echo -e "${CYAN}▶ 视频文件列表${NC}"
    echo
    for i in "${!files[@]}"; do
        local file="${files[$i]}"
        local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        local formatted_size=$(format_size "$size")
        printf "${YELLOW}%3d.${NC} %-50s ${CYAN}%s${NC}\n" $((i+1)) "$file" "$formatted_size"
    done
    echo
    
    echo -e "${BLUE}请输入要处理的文件序号${NC}"
    echo -e "${YELLOW}提示: 可用逗号或空格分隔多个序号，例如: 1,3,5 或 1 3 5${NC}"
    echo
    echo -ne "${BLUE}序号: ${NC}"
    user_input=$(read_with_default "")
    
    echo
    
    if [[ -z "$user_input" ]]; then
        echo -e "${RED}✗ 未输入任何序号！${NC}"
        return 1
    fi
    
    local selected_indices=()
    readarray -t selected_indices < <(parse_indices "$user_input" "${#files[@]}") || return 1
    
    echo -e "${GREEN}✓ 已选择 ${YELLOW}${#selected_indices[@]}${GREEN} 个文件${NC}"
    echo
    
    # 添加处理选项
    echo -e "${BLUE}请选择操作：${NC}"
    echo -e "  ${CYAN}[1]${NC} 开始处理视频"
    echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
    echo
    echo -ne "${BLUE}选择 [1-2]: ${NC}"
    action_choice=$(read_with_default)
    
    echo
    
    case "$action_choice" in
        1)
            # 开始处理视频
            echo -e "${CYAN}▸ 开始处理视频${NC}"
            echo
            
            select_template
            echo
            
            # 创建CSV日志文件
            create_csv_log
            echo
            
            local file_count=1
            for index in "${selected_indices[@]}"; do
                process_video "${files[$((index-1))]}" "$file_count" "${#selected_indices[@]}"
                ((file_count++))
            done
            ;;
        2)
            # 输出待处理视频信息
            echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
            echo
            
            local timestamp=$(date +"%Y%m%d_%H-%M")
            local info_file="待处理视频_${timestamp}.xls"
            
            # 创建信息文件并写入表头
            echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"
            
            # 遍历选中的文件，输出信息
            for index in "${selected_indices[@]}"; do
                local file="${files[$((index-1))]}"
                local file_dir=$(dirname "$file")
                local file_base=$(basename "$file")
                local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                local resolution=$(get_video_resolution "$file")
                if [[ -z "$resolution" ]]; then
                    resolution="未知"
                fi
                
                # 写入信息
                echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
            done
            
            echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
            echo -e "${YELLOW}  包含 ${#selected_indices[@]} 个视频的信息${NC}"
            ;;
        *)
            echo -e "${RED}✗ 无效选择！${NC}"
            return 1
            ;;
    esac
}

# 按大小过滤并处理文件
process_by_min_size() {
    local min_size="$1"
    local size_label="${2:-}"

    if [[ -z "$min_size" ]] || ! [[ "$min_size" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}✗ 无效的最小大小参数！${NC}"
        return 1
    fi

    local files=() large_files=()
    readarray -t files < <(get_video_files_recursive ".")

    # 过滤掉空字符串
    local valid_files=()
    for file in "${files[@]}"; do
        if [[ -n "$file" && -f "$file" ]]; then
            valid_files+=("$file")
        fi
    done
    files=("${valid_files[@]}")

    echo -e "${GREEN}✓ 筛选条件: 大于 ${YELLOW}$(format_size "$min_size")${NC}"
    echo
    echo -e "${CYAN}▶ 符合条件的视频文件${NC}"
    echo
    for file in "${files[@]}"; do
        local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        if (( size > min_size )); then
            large_files+=("$file")
            printf "${YELLOW}%3d.${NC} %-50s ${CYAN}%s${NC}\n" "${#large_files[@]}" "$file" "$(format_size "$size")"
        fi
    done

    if [[ ${#large_files[@]} -eq 0 ]]; then
        echo -e "${RED}✗ 未找到大于指定大小的视频文件！${NC}"
        return 1
    fi

    echo
    echo -e "${CYAN}找到 ${YELLOW}${#large_files[@]}${CYAN} 个符合条件的文件${NC}"
    echo
    echo -e "${BLUE}请选择操作：${NC}"
    echo -e "${CYAN}[1]${NC} 按序号选择处理"
    echo -e "${CYAN}[2]${NC} 处理所有文件"
    echo
    echo -ne "${BLUE}选择 [1-2]: ${NC}"
    sub_choice=$(read_with_default)

    echo

    case "$sub_choice" in
        1)
            echo -e "${BLUE}请输入要处理的文件序号（用逗号或空格分隔多个序号）:${NC}"
            user_input=$(read_with_default "")

            [[ -z "$user_input" ]] && { echo -e "${RED}未输入任何序号！${NC}"; return 1; }

            local selected_indices=()
            readarray -t selected_indices < <(parse_indices "$user_input" "${#large_files[@]}") || return 1

            local selected_files=()
            for index in "${selected_indices[@]}"; do
                selected_files+=("${large_files[$((index-1))]}")
            done

            echo -e "${GREEN}✓ 已选择 ${YELLOW}${#selected_files[@]}${GREEN} 个文件${NC}"
            echo

            # 添加处理选项
            echo -e "${BLUE}请选择操作：${NC}"
            echo -e "  ${CYAN}[1]${NC} 开始处理视频"
            echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
            echo
            echo -ne "${BLUE}选择 [1-2]: ${NC}"
            action_choice=$(read_with_default)

            echo

            case "$action_choice" in
                1)
                    echo -e "${CYAN}▸ 开始处理视频${NC}"
                    echo

                    select_template
                    echo

                    # 创建CSV日志文件
                    create_csv_log
                    echo

                    local file_count=1
                    for file in "${selected_files[@]}"; do
                        process_video "$file" "$file_count" "${#selected_files[@]}"
                        ((file_count++))
                    done
                    ;;
                2)
                    echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
                    echo

                    local timestamp=$(date +"%Y%m%d_%H-%M")
                    local info_file="待处理视频_${timestamp}.xls"

                    # 创建信息文件并写入表头
                    echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"

                    # 遍历选中的文件，输出信息
                    for file in "${selected_files[@]}"; do
                        local file_dir=$(dirname "$file")
                        local file_base=$(basename "$file")
                        local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                        local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                        local resolution=$(get_video_resolution "$file")
                        if [[ -z "$resolution" ]]; then
                            resolution="未知"
                        fi

                        # 写入信息
                        echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
                    done

                    echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
                    echo -e "${YELLOW}  包含 ${#selected_files[@]} 个视频的信息${NC}"
                    echo
                    
                    # 移动源文件到筛选目录
                    local dir_prefix=$(generate_filter_dir_prefix "$min_size" "GT" "$size_label")
                    move_files_to_filter_dir "$dir_prefix" "${selected_files[@]}"
                    ;;
                *)
                    echo -e "${RED}✗ 无效选择！${NC}"
                    return 1
                    ;;
            esac
            ;;
        2)
            echo -e "${GREEN}✓ 将处理所有 ${YELLOW}${#large_files[@]}${GREEN} 个大文件${NC}"
            echo

            # 添加处理选项
            echo -e "${BLUE}请选择操作：${NC}"
            echo -e "  ${CYAN}[1]${NC} 开始处理视频"
            echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
            echo
            echo -ne "${BLUE}选择 [1-2]: ${NC}"
            action_choice=$(read_with_default)

            echo

            case "$action_choice" in
                1)
                    echo -e "${CYAN}▸ 开始处理视频${NC}"
                    echo

                    select_template
                    echo

                    # 创建CSV日志文件
                    create_csv_log
                    echo

                    local file_count=1
                    for file in "${large_files[@]}"; do
                        process_video "$file" "$file_count" "${#large_files[@]}"
                        ((file_count++))
                    done
                    ;;
        2)
            echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
            echo

            local timestamp=$(date +"%Y%m%d_%H-%M")
            local info_file="待处理视频_${timestamp}.xls"

            # 创建信息文件并写入表头
            echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"

            # 遍历所有文件，输出信息
            for file in "${large_files[@]}"; do
                local file_dir=$(dirname "$file")
                local file_base=$(basename "$file")
                local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                local resolution=$(get_video_resolution "$file")
                if [[ -z "$resolution" ]]; then
                    resolution="未知"
                fi

                # 写入信息
                echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
            done

            echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
            echo -e "${YELLOW}  包含 ${#large_files[@]} 个视频的信息${NC}"
            echo
            
            # 移动源文件到筛选目录
            local dir_prefix=$(generate_filter_dir_prefix "$min_size" "GT" "$size_label")
            move_files_to_filter_dir "$dir_prefix" "${large_files[@]}"
            ;;
                *)
                    echo -e "${RED}✗ 无效选择！${NC}"
                    return 1
                    ;;
            esac
            ;;
        *)
            echo -e "${RED}✗ 无效选择！${NC}"
            return 1
            ;;
    esac
}

# 预设筛选：大于 300MB
process_over_300mb() {
    local size_label="${DEFAULT_GT_SIZE}"
    local min_size
    min_size=$(parse_size "$size_label")
    if (( min_size == -1 )); then
        echo -e "${RED}✗ 默认大小配置无效: ${YELLOW}$size_label${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ 预设筛选条件: 大于 ${YELLOW}$size_label${NC}"
    echo
    process_by_min_size "$min_size" "$size_label"
}

process_by_size() {
    echo -e "${BLUE}请输入最小文件大小${NC}"
    echo -e "${YELLOW}提示: 支持格式 100M, 1.5G, 500 (字节)${NC}"
    echo
    echo -ne "${BLUE}最小大小: ${NC}"
    size_input=$(read_with_default "")
    
    echo
    
    if [[ -z "$size_input" ]]; then
        echo -e "${RED}✗ 未输入文件大小！${NC}"
        return 1
    fi
    
    local min_size=$(parse_size "$size_input")
    if (( min_size == -1 )); then
        echo -e "${RED}✗ 无效的文件大小格式！${NC}"
        echo -e "${YELLOW}提示: 请使用如 100M, 1.5G 等格式${NC}"
        return 1
    fi

    process_by_min_size "$min_size" "$size_input"
}

# 按大小过滤并处理文件（小于指定大小）
process_by_small_size() {
    echo -e "${BLUE}请输入最大文件大小${NC}"
    echo -e "${YELLOW}提示: 支持格式 100M, 1.5G, 500 (字节)${NC}"
    echo
    echo -ne "${BLUE}最大大小: ${NC}"
    size_input=$(read_with_default "")
    
    echo
    
    if [[ -z "$size_input" ]]; then
        echo -e "${RED}✗ 未输入文件大小！${NC}"
        return 1
    fi
    
    local size_label="$size_input"
    local max_size=$(parse_size "$size_input")
    if (( max_size == -1 )); then
        echo -e "${RED}✗ 无效的文件大小格式！${NC}"
        echo -e "${YELLOW}提示: 请使用如 100M, 1.5G 等格式${NC}"
        return 1
    fi
    
    local files=() small_files=()
    readarray -t files < <(get_video_files_recursive ".")
    
    # 过滤掉空字符串
    local valid_files=()
    for file in "${files[@]}"; do
        if [[ -n "$file" && -f "$file" ]]; then
            valid_files+=("$file")
        fi
    done
    files=("${valid_files[@]}")
    
    echo -e "${GREEN}✓ 筛选条件: 小于 ${YELLOW}$(format_size "$max_size")${NC}"
    echo
    echo -e "${CYAN}▶ 符合条件的视频文件${NC}"
    echo
    for file in "${files[@]}"; do
        local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        if (( size < max_size )); then
            small_files+=("$file")
            printf "${YELLOW}%3d.${NC} %-50s ${CYAN}%s${NC}\n" "${#small_files[@]}" "$file" "$(format_size "$size")"
        fi
    done
    
    if [[ ${#small_files[@]} -eq 0 ]]; then
        echo -e "${RED}✗ 未找到小于指定大小的视频文件！${NC}"
        return 1
    fi
    
    echo
    echo -e "${CYAN}找到 ${YELLOW}${#small_files[@]}${CYAN} 个符合条件的文件${NC}"
    echo
    echo -e "${BLUE}请选择操作：${NC}"
    echo -e "${CYAN}[1]${NC} 按序号选择处理"
    echo -e "${CYAN}[2]${NC} 处理所有文件"
    echo
    echo -ne "${BLUE}选择 [1-2]: ${NC}"
    sub_choice=$(read_with_default)
    
    echo
    
    case "$sub_choice" in
        1)
            echo -e "${BLUE}请输入要处理的文件序号（用逗号或空格分隔多个序号）:${NC}"
            user_input=$(read_with_default "")
            
            [[ -z "$user_input" ]] && { echo -e "${RED}未输入任何序号！${NC}"; return 1; }
            
            local selected_indices=()
            readarray -t selected_indices < <(parse_indices "$user_input" "${#small_files[@]}") || return 1
            
            local selected_files=()
            for index in "${selected_indices[@]}"; do
                selected_files+=("${small_files[$((index-1))]}")
            done
            
            echo -e "${GREEN}✓ 已选择 ${YELLOW}${#selected_files[@]}${GREEN} 个文件${NC}"
            echo
            
            # 添加处理选项
            echo -e "${BLUE}请选择操作：${NC}"
            echo -e "  ${CYAN}[1]${NC} 开始处理视频"
            echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
            echo
            echo -ne "${BLUE}选择 [1-2]: ${NC}"
            action_choice=$(read_with_default)
            
            echo
            
            case "$action_choice" in
                1)
                    echo -e "${CYAN}▸ 开始处理视频${NC}"
                    echo
                    
                    select_template
                    echo
                    
                    # 创建CSV日志文件
                    create_csv_log
                    echo
                    
                    local file_count=1
                    for file in "${selected_files[@]}"; do
                        process_video "$file" "$file_count" "${#selected_files[@]}"
                        ((file_count++))
                    done
                    ;;
                2)
                    echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
                    echo
                    
                    local timestamp=$(date +"%Y%m%d_%H-%M")
                    local info_file="待处理视频_${timestamp}.xls"
                    
                    # 创建信息文件并写入表头
                    echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"
                    
                    # 遍历选中的文件，输出信息
                    for file in "${selected_files[@]}"; do
                        local file_dir=$(dirname "$file")
                        local file_base=$(basename "$file")
                        local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                        local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                        local resolution=$(get_video_resolution "$file")
                        if [[ -z "$resolution" ]]; then
                            resolution="未知"
                        fi
                        
                        # 写入信息
                        echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
                    done
                    
                    echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
                    echo -e "${YELLOW}  包含 ${#selected_files[@]} 个视频的信息${NC}"
                    echo
                    
                    # 移动源文件到筛选目录
                    local dir_prefix=$(generate_filter_dir_prefix "$max_size" "LT" "$size_label")
                    move_files_to_filter_dir "$dir_prefix" "${selected_files[@]}"
                    ;;
                *)
                    echo -e "${RED}✗ 无效选择！${NC}"
                    return 1
                    ;;
            esac
            ;;
        2)
            echo -e "${GREEN}✓ 将处理所有 ${YELLOW}${#small_files[@]}${GREEN} 个小文件${NC}"
            echo
            
            # 添加处理选项
            echo -e "${BLUE}请选择操作：${NC}"
            echo -e "  ${CYAN}[1]${NC} 开始处理视频"
            echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
            echo
            echo -ne "${BLUE}选择 [1-2]: ${NC}"
            action_choice=$(read_with_default)
            
            echo
            
            case "$action_choice" in
                1)
                    echo -e "${CYAN}▸ 开始处理视频${NC}"
                    echo
                    
                    select_template
                    echo
                    
                    # 创建CSV日志文件
                    create_csv_log
                    echo
                    
                    local file_count=1
                    for file in "${small_files[@]}"; do
                        process_video "$file" "$file_count" "${#small_files[@]}"
                        ((file_count++))
                    done
                    ;;
                2)
                    echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
                    echo
                    
                    local timestamp=$(date +"%Y%m%d_%H-%M")
                    local info_file="待处理视频_${timestamp}.xls"
                    
                    # 创建信息文件并写入表头
                    echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"
                    
                    # 遍历所有文件，输出信息
                    for file in "${small_files[@]}"; do
                        local file_dir=$(dirname "$file")
                        local file_base=$(basename "$file")
                        local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                        local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                        local resolution=$(get_video_resolution "$file")
                        if [[ -z "$resolution" ]]; then
                            resolution="未知"
                        fi
                        
                        # 写入信息
                        echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
                    done
                    
                    echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
                    echo -e "${YELLOW}  包含 ${#small_files[@]} 个视频的信息${NC}"
                    echo
                    
                    # 移动源文件到筛选目录
                    local dir_prefix=$(generate_filter_dir_prefix "$max_size" "LT" "$size_label")
                    move_files_to_filter_dir "$dir_prefix" "${small_files[@]}"
                    ;;
                *)
                    echo -e "${RED}✗ 无效选择！${NC}"
                    return 1
                    ;;
            esac
            ;;
        *)
            echo -e "${RED}✗ 无效选择！${NC}"
            return 1
            ;;
    esac
}

# 处理所有视频文件
process_all_files() {
    local files=()
    readarray -t files < <(get_video_files_recursive ".")
    
    # 过滤掉空字符串
    local valid_files=()
    for file in "${files[@]}"; do
        if [[ -n "$file" && -f "$file" ]]; then
            valid_files+=("$file")
        fi
    done
    files=("${valid_files[@]}")
    
    if [[ ${#files[@]} -eq 0 ]]; then
        echo -e "${RED}✗ 未找到任何视频文件！${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ 找到 ${YELLOW}${#files[@]}${GREEN} 个视频文件${NC}"
    echo
    
    # 添加处理选项
    echo -e "${BLUE}请选择操作：${NC}"
    echo -e "  ${CYAN}[1]${NC} 开始处理视频"
    echo -e "  ${CYAN}[2]${NC} 输出待处理视频信息（xls文件）"
    echo
    echo -ne "${BLUE}选择 [1-2]: ${NC}"
    action_choice=$(read_with_default)
    
    echo
    
    case "$action_choice" in
        1)
            # 开始处理视频
            echo -e "${CYAN}▸ 开始处理视频${NC}"
            echo
            
            select_template
            echo
            
            # 创建CSV日志文件
            create_csv_log
            echo
            
            local file_count=1
            for file in "${files[@]}"; do
                process_video "$file" "$file_count" "${#files[@]}"
                ((file_count++))
            done
            ;;
        2)
            # 输出待处理视频信息
            echo -e "${CYAN}▸ 正在生成待处理视频信息...${NC}"
            echo
            
            local timestamp=$(date +"%Y%m%d_%H-%M")
            local info_file="待处理视频_${timestamp}.xls"
            
            # 创建信息文件并写入表头
            echo -e "文件大小(M)\t分辨率\t文件名\t目录" > "$info_file"
            
            # 遍历所有文件，输出信息
            for file in "${files[@]}"; do
                local file_dir=$(dirname "$file")
                local file_base=$(basename "$file")
                local file_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
                local file_size_mb=$(awk "BEGIN {printf \"%.2f\", $file_size / 1048576}")
                local resolution=$(get_video_resolution "$file")
                if [[ -z "$resolution" ]]; then
                    resolution="未知"
                fi
                
                # 写入信息
                echo -e "${file_size_mb}\t${resolution}\t${file_base}\t${file_dir}" >> "$info_file"
            done
            
            echo -e "${GREEN}✓ 已生成待处理视频信息文件: ${CYAN}$info_file${NC}"
            echo -e "${YELLOW}  包含 ${#files[@]} 个视频的信息${NC}"
            ;;
        *)
            echo -e "${RED}✗ 无效选择！${NC}"
            return 1
            ;;
    esac
}

# 主菜单
show_menu() {
    echo
    echo -e "${BLUE}▶ FFmpeg 视频转换工具 - 主菜单${NC}"
    echo
    echo -e "  ${CYAN}[1]${NC} 筛选（>${DEFAULT_GT_SIZE}）的文件"
    echo -e "  ${CYAN}[2]${NC} 处理所有视频文件"
    echo -e "  ${CYAN}[3]${NC} 按大小筛选（大于）"
    echo -e "  ${CYAN}[4]${NC} 按大小筛选（小于）"
    echo -e "  ${CYAN}[5]${NC} 手动序号筛选"
    echo
    echo -e "  ${YELLOW}[0]${NC} 退出程序"
    echo
    echo -ne "${BLUE}请选择功能 [0-5]: ${NC}"
}

# 处理指定路径（目录或文件）
process_path() {
    local path="$1"
    
    if [[ ! -e "$path" ]]; then
        echo -e "${RED}错误: 路径不存在: $path${NC}"
        exit 1
    fi
    
    if [[ -f "$path" ]]; then
        # 单文件模式
        if ! is_video_file "$path"; then
            echo -e "${RED}错误: 不是支持的视频文件: $path${NC}"
            exit 1
        fi
        
        is_single_file=true
        target_path="$path"
        
        echo -e "${GREEN}单文件模式${NC}"
        echo -e "${CYAN}文件: $path${NC}"
        echo
        
        select_template
        echo
        
        create_csv_log
        echo
        
        process_video "$path" "1" "1"
        
    elif [[ -d "$path" ]]; then
        # 目录模式
        target_path="${path%/}"  # 移除尾部斜杠
        local dir_name=$(basename "$target_path")
        local parent_dir=$(dirname "$target_path")
        base_backup_dir="${parent_dir}/${dir_name}_bak"
        
        echo -e "${GREEN}目录模式${NC}"
        echo -e "${CYAN}搜索目录: $target_path${NC}"
        echo -e "${CYAN}备份目录: $base_backup_dir${NC}"
        echo
        
        # 递归查找所有视频文件
        local files=()
        readarray -t files < <(get_video_files_recursive "$target_path")
        
        if [[ ${#files[@]} -eq 0 ]]; then
            echo -e "${RED}未找到任何视频文件！${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}=== 找到 ${#files[@]} 个视频文件 ===${NC}"
        for i in "${!files[@]}"; do
            local file="${files[$i]}"
            local size=$(stat -c%s "$file" 2>/dev/null || echo "0")
            local formatted_size=$(format_size "$size")
            printf "%3d. %-80s %s\n" $((i+1)) "$file" "$formatted_size"
        done
        echo
        
        select_template
        echo
        
        # 创建备份目录
        mkdir -p "$base_backup_dir"
        
        create_csv_log
        echo
        
        # 处理所有视频文件
        local file_count=1
        for file in "${files[@]}"; do
            process_video "$file" "$file_count" "${#files[@]}"
            ((file_count++))
        done
    fi
}

# 选择工作目录
select_working_directory() {
    echo -e "${CYAN}▸ 选择工作目录${NC}" >&2
    echo >&2
    
    # 获取当前目录的绝对路径
    local current_dir=$(pwd)
    
    # 获取当前目录下的所有子目录（仅一级）
    local dirs=()
    while IFS= read -r dir; do
        [[ -z "$dir" ]] && continue
        local dir_name=$(basename "$dir")
        # 排除以 . 开头的隐藏目录和 ffmpeg_ 开头的目录
        if [[ ! "$dir_name" =~ ^\. ]] && [[ ! "$dir_name" =~ ^ffmpeg_ ]]; then
            dirs+=("$dir")
        fi
    done < <(find . -maxdepth 1 -type d ! -path . 2>/dev/null | sort)
    
    # 显示目录选项（输出到stderr，避免被捕获）
    echo -e "  ${CYAN}[1]${NC} 当前目录: ${GREEN}${current_dir}${NC}" >&2
    
    if [[ ${#dirs[@]} -gt 0 ]]; then
        for i in "${!dirs[@]}"; do
            local dir_name=$(basename "${dirs[$i]}")
            printf "  ${CYAN}[%d]${NC} %s\n" $((i+2)) "$dir_name" >&2
        done
    fi
    
    echo >&2
    echo -ne "${BLUE}请选择工作目录 [1-$((${#dirs[@]}+1))]: ${NC}" >&2
    dir_choice=$(read_with_default)
    
    echo >&2
    
    # 验证并返回选择的目录（只有这里输出到stdout）
    if [[ "$dir_choice" == "1" ]]; then
        echo "$current_dir"
        return 0
    elif [[ "$dir_choice" =~ ^[0-9]+$ ]] && (( dir_choice >= 2 && dir_choice <= ${#dirs[@]}+1 )); then
        local selected_dir="${dirs[$((dir_choice-2))]}"
        local abs_path=$(cd "$selected_dir" 2>/dev/null && pwd)
        echo "$abs_path"
        return 0
    else
        echo -e "${RED}✗ 无效选择${NC}" >&2
        return 1
    fi
}

# 主程序
main() {
    init_templates
    
    if ! command -v awk &> /dev/null; then
        echo -e "${RED}错误: 需要 awk 命令来计算文件大小\n请安装 awk 或 gawk${NC}"
        exit 1
    fi
    
    if ! command -v ffprobe &> /dev/null; then
        echo -e "${YELLOW}警告: 未找到 ffprobe 命令\n分辨率限制功能将不可用${NC}"
        echo
    fi
    
    # 显示欢迎信息
    clear
    echo
    echo -e "${GREEN}◆ FFmpeg 视频转换工具${NC}"
    echo
    
    # 检查是否提供了路径参数
    if [[ $# -gt 0 ]]; then
        # 路径模式
        echo -e "${CYAN}▸ 命令行模式${NC}"
        echo
        process_path "$1"
    else
        # 交互模式 - 选择工作目录
        local input_path
        input_path=$(select_working_directory)
        
        if [[ $? -ne 0 ]] || [[ -z "$input_path" ]]; then
            echo -e "${RED}✗ 工作目录选择失败${NC}"
            exit 1
        fi
        
        # 显示选择的工作路径
        echo -e "${GREEN}✓ 工作目录: ${CYAN}$input_path${NC}"
        
        # 如果是文件，直接处理
        if [[ -f "$input_path" ]]; then
            echo -e "${GREEN}✓ 检测到单个文件，进入处理流程${NC}"
            echo
            process_path "$input_path"
        else
            # 如果是目录，进入当前目录并显示菜单
            cd "$input_path" || exit 1
            
            # 统计视频文件数量
            local video_files_list=()
            readarray -t video_files_list < <(get_video_files_recursive ".")
            # 过滤空行
            local valid_video_count=0
            for vf in "${video_files_list[@]}"; do
                [[ -n "$vf" ]] && ((valid_video_count++))
            done
            echo -e "${GREEN}✓ 检测到 ${YELLOW}$valid_video_count${GREEN} 个视频文件${NC}"
            
            # 主循环
            while true; do
                show_menu
                choice=$(read_with_default)
                
                echo
                
                case "$choice" in
                    1) 
                        echo -e "${CYAN}▸ 筛选（>${DEFAULT_GT_SIZE}）的文件${NC}"
                        echo
                        process_over_300mb
                        ;;
                    2) 
                        echo -e "${CYAN}▸ 处理全部文件${NC}"
                        echo
                        process_all_files
                        ;;
                    3) 
                        echo -e "${CYAN}▸ 按大小筛选（大于）${NC}"
                        echo
                        process_by_size 
                        ;;
                    4) 
                        echo -e "${CYAN}▸ 按大小筛选（小于）${NC}"
                        echo
                        process_by_small_size 
                        ;;
                    5) 
                        echo -e "${CYAN}▸ 手动序号筛选${NC}"
                        echo
                        process_by_indices 
                        ;;
                    0) 
                        exit 0
                        ;;
                    *) 
                        echo -e "${RED}✗ 无效选择，请输入 0-5${NC}"
                        sleep 1
                        continue
                        ;;
                esac
                
                # 任务完成提示
                echo
                echo -e "${GREEN}✓ 任务完成！${NC}"
                echo
                echo -ne "${YELLOW}按回车键返回主菜单...${NC}"
                read -r
                clear
                echo -e "${GREEN}✓ 工作路径: ${CYAN}$input_path${NC}"
                echo -e "${GREEN}✓ 检测到 ${YELLOW}$valid_video_count${GREEN} 个视频文件${NC}"
            done
        fi
    fi
}

# 运行主程序
main "$@"
