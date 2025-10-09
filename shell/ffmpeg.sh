#!/bin/bash


# 支持的视频文件扩展名
video_extensions=("mp4" "avi" "mkv" "mov" "wmv" "flv" "webm" "m4v" "3gp" "mpg" "mpeg" "ts" "mts" "m2ts")

# FFmpeg 参数配置
output="ffmpeg"
suffix=""
crf=18
preset=slow
video_codec="libx265"
ffmpeg_options="-hide_banner"
audio_codec="copy"

# FFmpeg 模板配置
declare -A ffmpeg_templates

# 定义预设模板
init_templates() {
    # ffmpeg_templates["编号"]="模板名称|视频编码器|CRF值|编码预设|输出目录"
    ffmpeg_templates["1"]="H265 Slow-18|libx265|18|slow|ffmpeg_h265-slow-18"
    ffmpeg_templates["2"]="H265 Slow-23|libx265|23|slow|ffmpeg_h265-slow-23"
    ffmpeg_templates["3"]="H265 Medium-18|libx265|18|medium|ffmpeg_h265-medium-18"
    ffmpeg_templates["4"]="H265 Medium-23|libx265|23|medium|ffmpeg_h265-medium-23"
}

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示FFmpeg模板选择菜单
show_template_menu() {
    echo -e "${CYAN}=== FFmpeg 转换模板选择 ===${NC}"
    echo
    for key in $(printf '%s\n' "${!ffmpeg_templates[@]}" | sort -n); do
        IFS='|' read -r name codec crf_val preset_val output_suffix <<< "${ffmpeg_templates[$key]}"
        printf "%2s. %-20s | 编码: %-8s | CRF: %-2s | 预设: %-10s | 输出目录: %s\n" \
               "$key" "$name" "$codec" "$crf_val" "$preset_val" "$output_suffix"
    done
    echo
    echo -e "${BLUE}请选择模板 (1-${#ffmpeg_templates[@]}):${NC}"
}

# 选择并应用FFmpeg模板
select_template() {
    show_template_menu
    read -r template_choice
    
    if [[ -z "$template_choice" ]]; then
        echo -e "${RED}未选择模板，使用默认设置${NC}"
        return 0
    fi
    
    if [[ -n "${ffmpeg_templates[$template_choice]}" ]]; then
        IFS='|' read -r template_name video_codec crf preset output_suffix <<< "${ffmpeg_templates[$template_choice]}"
        
        echo -e "${GREEN}已选择模板: $template_name${NC}"
        echo -e "${YELLOW}参数设置:${NC}"
        echo -e "  视频编码: ${CYAN}$video_codec${NC}"
        echo -e "  CRF值:    ${CYAN}$crf${NC}"
        echo -e "  预设:     ${CYAN}$preset${NC}"
        echo -e "  输出目录: ${CYAN}$output_suffix${NC}"
        echo
        
        # 更新输出目录
        output="$output_suffix"
        mkdir -p "./$output"
        
        return 0
    else
        echo -e "${RED}无效的模板选择: $template_choice${NC}"
        echo -e "${YELLOW}使用默认设置${NC}"
        return 1
    fi
}

# 获取所有视频文件
get_video_files() {
   video_files=()
    for file in *; do
        if [[ -f "$file" ]]; then
            extension="${file##*.}"
            extension_lower=$(echo "$extension" | tr '[:upper:]' '[:lower:]')
            
            for ext in "${video_extensions[@]}"; do
                if [[ "$extension_lower" == "$ext" ]]; then
                    video_files+=("$file")
                    break
                fi
            done
        fi
    done
    printf '%s\n' "${video_files[@]}"
}

# 格式化文件大小显示
format_size() {
   size=$1
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
   input="$1"
   number
   unit
    
    if [[ "$input" =~ ^([0-9]+\.?[0-9]*)([GMgm]?)$ ]]; then
        number="${BASH_REMATCH[1]}"
        unit="${BASH_REMATCH[2]}"
        
        case "${unit,,}" in
            "g") echo "$(awk "BEGIN {printf \"%.0f\", $number * 1073741824}")" ;;
            "m") echo "$(awk "BEGIN {printf \"%.0f\", $number * 1048576}")" ;;
            "") echo "$(awk "BEGIN {printf \"%.0f\", $number}")" ;;
            *) echo "-1" ;;
        esac
    else
        echo "-1"
    fi
}

# 列出视频文件
list_video_files() {
   files=()
    readarray -t files < <(get_video_files)
    
    if [[ ${#files[@]} -eq 0 ]]; then
        echo -e "${RED}未找到任何视频文件！${NC}"
        return 1
    fi
    
    echo -e "${BLUE}=== 视频文件列表 ===${NC}"
    for i in "${!files[@]}"; do
       file="${files[$i]}"
       size
       formatted_size
        size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        formatted_size=$(format_size "$size")
        printf "%3d. %-50s %s\n" $((i+1)) "$file" "$formatted_size"
    done
    echo
    
    return 0
}

# 解析用户输入的序号
parse_indices() {
   input="$1"
   max_index="$2"
   indices=()
    
    # 替换逗号为空格，然后分割
    input=$(echo "$input" | tr ',' ' ')
    read -ra ADDR <<< "$input"
    
    for i in "${ADDR[@]}"; do
        if [[ "$i" =~ ^[0-9]+$ ]] && [[ "$i" -ge 1 ]] && [[ "$i" -le "$max_index" ]]; then
            indices+=("$i")
        else
            echo -e "${RED}无效序号: $i${NC}"
            return 1
        fi
    done
    
    printf '%s\n' "${indices[@]}"
    return 0
}

# 处理单个视频文件
process_video() {
   file="$1"
   filename="${file%.*}"
    
    echo -e "${YELLOW}正在处理: $file${NC}"
    echo "输出到: ./${output}/${filename}${suffix}.mp4"
    
    # 执行ffmpeg命令
    ffmpeg $ffmpeg_options -i "$file" -vcodec "$video_codec" -preset "$preset" -crf "$crf" -acodec "$audio_codec" "./${output}/${filename}${suffix}.mp4" -y
    
    # 检查命令执行结果
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✓ 成功处理: $file${NC}"
        
        # 显示输出文件信息
       output_file="./${output}/${filename}${suffix}.mp4"
        if [[ -f "$output_file" ]]; then
           original_size=$(stat -c%s "$file" 2>/dev/null || echo "0")
           output_size=$(stat -c%s "$output_file" 2>/dev/null || echo "0")
           original_formatted=$(format_size "$original_size")
           output_formatted=$(format_size "$output_size")
            
            if [[ "$original_size" -gt 0 ]] && [[ "$output_size" -gt 0 ]]; then
               compression_ratio=$(awk "BEGIN {printf \"%.1f\", ($original_size - $output_size) * 100 / $original_size}")
                echo -e "  ${CYAN}原始大小: $original_formatted → 输出大小: $output_formatted (压缩 ${compression_ratio}%)${NC}"
            fi
            
            # 移动原始文件到备份目录
           backup_dir="ffmpeg_bak"
            mkdir -p "./$backup_dir"
            
            if mv "$file" "./$backup_dir/"; then
                echo -e "  ${GREEN}✓ 原始文件已移动到: ./$backup_dir/$file${NC}"
            else
                echo -e "  ${YELLOW}⚠ 警告: 无法移动原始文件到备份目录${NC}"
            fi
        fi
    else
        echo -e "${RED}✗ 处理失败: $file${NC}"
    fi
    echo "----------------------------------------"
}

# 按序号选择处理文件
process_by_indices() {
   files=()
    readarray -t files < <(get_video_files)
    
    if ! list_video_files; then
        return 1
    fi
    
    echo -e "${BLUE}请输入要处理的文件序号（用逗号或空格分隔多个序号）:${NC}"
    read -r user_input
    
    if [[ -z "$user_input" ]]; then
        echo -e "${RED}未输入任何序号！${NC}"
        return 1
    fi
    
   selected_indices=()
    readarray -t selected_indices < <(parse_indices "$user_input" "${#files[@]}")
    
    if [[ ${#selected_indices[@]} -eq 0 ]]; then
        return 1
    fi
    
    echo -e "${GREEN}将处理 ${#selected_indices[@]} 个文件${NC}"
    echo
    
    # 选择FFmpeg模板
    select_template
    echo
    
    for index in "${selected_indices[@]}"; do
       file="${files[$((index-1))]}"
        process_video "$file"
    done
}

# 按大小过滤并处理文件
process_by_size() {
    echo -e "${BLUE}请输入最小文件大小（例如: 100M, 1.5G, 500）:${NC}"
    read -r size_input
    
    if [[ -z "$size_input" ]]; then
        echo -e "${RED}未输入文件大小！${NC}"
        return 1
    fi
    
   min_size
    min_size=$(parse_size "$size_input")
    if [[ "$min_size" -eq -1 ]]; then
        echo -e "${RED}无效的文件大小格式！请使用如 100M, 1.5G 等格式${NC}"
        return 1
    fi
    
   files=()
    readarray -t files < <(get_video_files)
   large_files=()
    
    echo -e "${BLUE}=== 大于 $(format_size "$min_size") 的视频文件 ===${NC}"
    for file in "${files[@]}"; do
       size
        size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        if [[ "$size" -gt "$min_size" ]]; then
            large_files+=("$file")
           formatted_size
            formatted_size=$(format_size "$size")
            printf "%3d. %-50s %s\n" "${#large_files[@]}" "$file" "$formatted_size"
        fi
    done
    
    if [[ ${#large_files[@]} -eq 0 ]]; then
        echo -e "${RED}未找到大于指定大小的视频文件！${NC}"
        return 1
    fi
    
    echo
    echo -e "${BLUE}子选项：${NC}"
    echo "1. 按序号选择处理"
    echo "2. 处理所有文件"
    echo -e "${BLUE}请选择 (1-2):${NC}"
    read -r sub_choice
    
    case "$sub_choice" in
        1)
            echo -e "${BLUE}请输入要处理的文件序号（用逗号或空格分隔多个序号）:${NC}"
            read -r user_input
            
            if [[ -z "$user_input" ]]; then
                echo -e "${RED}未输入任何序号！${NC}"
                return 1
            fi
            
           selected_indices=()
            readarray -t selected_indices < <(parse_indices "$user_input" "${#large_files[@]}")
            
            if [[ ${#selected_indices[@]} -eq 0 ]]; then
                return 1
            fi
            
            echo -e "${GREEN}将处理 ${#selected_indices[@]} 个文件${NC}"
            echo
            
            # 选择FFmpeg模板
            select_template
            echo
            
            for index in "${selected_indices[@]}"; do
               file="${large_files[$((index-1))]}"
                process_video "$file"
            done
            ;;
        2)
            echo -e "${GREEN}将处理所有 ${#large_files[@]} 个大文件${NC}"
            echo
            
            # 选择FFmpeg模板
            select_template
            echo
            
            for file in "${large_files[@]}"; do
                process_video "$file"
            done
            ;;
        *)
            echo -e "${RED}无效选择！${NC}"
            return 1
            ;;
    esac
}

# 按大小过滤并处理文件（小于指定大小）
process_by_small_size() {
    echo -e "${BLUE}请输入最大文件大小（例如: 100M, 1.5G, 500）:${NC}"
    read -r size_input
    
    if [[ -z "$size_input" ]]; then
        echo -e "${RED}未输入文件大小！${NC}"
        return 1
    fi
    
    local max_size
    max_size=$(parse_size "$size_input")
    if [[ "$max_size" -eq -1 ]]; then
        echo -e "${RED}无效的文件大小格式！请使用如 100M, 1.5G 等格式${NC}"
        return 1
    fi
    
    local files=()
    readarray -t files < <(get_video_files)
    local small_files=()
    
    echo -e "${BLUE}=== 小于 $(format_size "$max_size") 的视频文件 ===${NC}"
    for file in "${files[@]}"; do
        local size
        size=$(stat -c%s "$file" 2>/dev/null || echo "0")
        if [[ "$size" -lt "$max_size" ]]; then
            small_files+=("$file")
            local formatted_size
            formatted_size=$(format_size "$size")
            printf "%3d. %-50s %s\n" "${#small_files[@]}" "$file" "$formatted_size"
        fi
    done
    
    if [[ ${#small_files[@]} -eq 0 ]]; then
        echo -e "${RED}未找到小于指定大小的视频文件！${NC}"
        return 1
    fi
    
    echo
    echo -e "${BLUE}子选项：${NC}"
    echo "1. 按序号选择处理"
    echo "2. 处理所有文件"
    echo -e "${BLUE}请选择 (1-2):${NC}"
    read -r sub_choice
    
    case "$sub_choice" in
        1)
            echo -e "${BLUE}请输入要处理的文件序号（用逗号或空格分隔多个序号）:${NC}"
            read -r user_input
            
            if [[ -z "$user_input" ]]; then
                echo -e "${RED}未输入任何序号！${NC}"
                return 1
            fi
            
            local selected_indices=()
            readarray -t selected_indices < <(parse_indices "$user_input" "${#small_files[@]}")
            
            if [[ ${#selected_indices[@]} -eq 0 ]]; then
                return 1
            fi
            
            echo -e "${GREEN}将处理 ${#selected_indices[@]} 个文件${NC}"
            echo
            
            # 选择FFmpeg模板
            select_template
            echo
            
            for index in "${selected_indices[@]}"; do
                local file="${small_files[$((index-1))]}"
                process_video "$file"
            done
            ;;
        2)
            echo -e "${GREEN}将处理所有 ${#small_files[@]} 个小文件${NC}"
            echo
            
            # 选择FFmpeg模板
            select_template
            echo
            
            for file in "${small_files[@]}"; do
                process_video "$file"
            done
            ;;
        *)
            echo -e "${RED}无效选择！${NC}"
            return 1
            ;;
    esac
}

# 处理所有视频文件
process_all_files() {
   files=()
    readarray -t files < <(get_video_files)
    
    if [[ ${#files[@]} -eq 0 ]]; then
        echo -e "${RED}未找到任何视频文件！${NC}"
        return 1
    fi
    
    echo -e "${GREEN}将处理所有 ${#files[@]} 个视频文件${NC}"
    echo
    
    # 选择FFmpeg模板
    select_template
    echo
    
    for file in "${files[@]}"; do
        process_video "$file"
    done
}

# 主菜单
show_menu() {
    echo -e "${BLUE}=== FFmpeg 视频转换工具 ===${NC}"
    echo "1. 按序号选择处理文件"
    echo "2. 处理大于指定大小的文件"
    echo "3. 处理小于指定大小的文件"
    echo "4. 处理所有视频文件"
    echo "0. 退出"
    echo -e "${BLUE}请选择功能 (0-4):${NC}"
}

# 主程序
main() {
    # 初始化FFmpeg模板
    init_templates
    
    # 检查awk命令是否存在（通常系统内置）
    if ! command -v awk &> /dev/null; then
        echo -e "${RED}错误: 需要 awk 命令来计算文件大小${NC}"
        echo "请安装 awk 或 gawk"
        exit 1
    fi
    
    while true; do
        show_menu
        read -r choice
        
        case "$choice" in
            1)
                process_by_indices
                ;;
            2)
                process_by_size
                ;;
            3)
                process_by_small_size
                ;;
            4)
                process_all_files
                ;;
            0)
                echo -e "${GREEN}退出程序${NC}"
                break
                ;;
            *)
                echo -e "${RED}无效选择，请输入 0-4${NC}"
                ;;
        esac
        
        echo
        echo -e "${YELLOW}按回车键继续...${NC}"
        read -r
        echo
    done
}

# 运行主程序
main

