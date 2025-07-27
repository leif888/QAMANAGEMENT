#!/bin/bash

# QA管理系统监控脚本

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志文件
LOG_FILE="monitor.log"

# 记录日志
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# 检查服务状态
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "检查 $service_name... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_status" ]; then
            echo -e "${GREEN}✓ 正常${NC} (HTTP $response)"
            log "$service_name - 正常 (HTTP $response)"
            return 0
        else
            echo -e "${RED}✗ 异常${NC} (HTTP $response)"
            log "$service_name - 异常 (HTTP $response)"
            return 1
        fi
    else
        echo -e "${RED}✗ 无法连接${NC}"
        log "$service_name - 无法连接"
        return 1
    fi
}

# 检查Docker容器状态
check_containers() {
    echo -e "\n${BLUE}=== Docker容器状态 ===${NC}"
    
    containers=("qamanagement_backend_1" "qamanagement_frontend_1" "qamanagement_nginx_1")
    
    for container in "${containers[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$container"; then
            status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
            if [ "$status" = "running" ]; then
                echo -e "$container: ${GREEN}运行中${NC}"
                log "容器 $container - 运行中"
            else
                echo -e "$container: ${RED}$status${NC}"
                log "容器 $container - $status"
            fi
        else
            echo -e "$container: ${RED}未找到${NC}"
            log "容器 $container - 未找到"
        fi
    done
}

# 检查系统资源
check_resources() {
    echo -e "\n${BLUE}=== 系统资源使用情况 ===${NC}"
    
    # CPU使用率
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    echo "CPU使用率: ${cpu_usage}%"
    log "CPU使用率: ${cpu_usage}%"
    
    # 内存使用率
    memory_info=$(free | grep Mem)
    total_mem=$(echo $memory_info | awk '{print $2}')
    used_mem=$(echo $memory_info | awk '{print $3}')
    memory_usage=$(awk "BEGIN {printf \"%.1f\", $used_mem/$total_mem*100}")
    echo "内存使用率: ${memory_usage}%"
    log "内存使用率: ${memory_usage}%"
    
    # 磁盘使用率
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    echo "磁盘使用率: ${disk_usage}%"
    log "磁盘使用率: ${disk_usage}%"
    
    # 警告检查
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo -e "${RED}警告: CPU使用率过高${NC}"
        log "警告: CPU使用率过高 ($cpu_usage%)"
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l) )); then
        echo -e "${RED}警告: 内存使用率过高${NC}"
        log "警告: 内存使用率过高 ($memory_usage%)"
    fi
    
    if [ "$disk_usage" -gt 80 ]; then
        echo -e "${RED}警告: 磁盘使用率过高${NC}"
        log "警告: 磁盘使用率过高 ($disk_usage%)"
    fi
}

# 检查数据库
check_database() {
    echo -e "\n${BLUE}=== 数据库状态 ===${NC}"
    
    if [ -f "backend/qa_management.db" ]; then
        db_size=$(du -h backend/qa_management.db | cut -f1)
        echo "数据库文件大小: $db_size"
        log "数据库文件大小: $db_size"
        
        # 检查数据库是否可访问
        if sqlite3 backend/qa_management.db "SELECT 1;" > /dev/null 2>&1; then
            echo -e "数据库连接: ${GREEN}正常${NC}"
            log "数据库连接: 正常"
        else
            echo -e "数据库连接: ${RED}异常${NC}"
            log "数据库连接: 异常"
        fi
    else
        echo -e "数据库文件: ${RED}未找到${NC}"
        log "数据库文件: 未找到"
    fi
}

# 主监控函数
main_monitor() {
    echo -e "${BLUE}=== QA管理系统监控报告 ===${NC}"
    echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
    
    log "=== 开始监控检查 ==="
    
    # 检查服务
    echo -e "\n${BLUE}=== 服务状态检查 ===${NC}"
    check_service "前端服务" "http://localhost:3000"
    check_service "后端API" "http://localhost:8000/health"
    check_service "API文档" "http://localhost:8000/docs"
    
    # 检查容器
    if command -v docker &> /dev/null; then
        check_containers
    else
        echo -e "\n${YELLOW}Docker未安装，跳过容器检查${NC}"
    fi
    
    # 检查资源
    check_resources
    
    # 检查数据库
    if command -v sqlite3 &> /dev/null; then
        check_database
    else
        echo -e "\n${YELLOW}SQLite3未安装，跳过数据库检查${NC}"
    fi
    
    log "=== 监控检查完成 ==="
    echo -e "\n${GREEN}监控检查完成！${NC}"
    echo "详细日志请查看: $LOG_FILE"
}

# 持续监控模式
continuous_monitor() {
    echo "启动持续监控模式 (每60秒检查一次，按Ctrl+C退出)"
    while true; do
        clear
        main_monitor
        sleep 60
    done
}

# 脚本参数处理
case "${1:-}" in
    "continuous"|"-c")
        continuous_monitor
        ;;
    "help"|"-h"|"--help")
        echo "QA管理系统监控脚本"
        echo "用法:"
        echo "  $0              # 执行一次监控检查"
        echo "  $0 continuous   # 持续监控模式"
        echo "  $0 -c           # 持续监控模式（简写）"
        echo "  $0 help         # 显示帮助信息"
        ;;
    *)
        main_monitor
        ;;
esac
