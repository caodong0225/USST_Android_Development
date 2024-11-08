package com.yclxiao.flinkcdcdemo.job;

import com.yclxiao.flinkcdcdemo.config.RedisConfig;
import org.quartz.Job;
import org.quartz.JobExecutionContext;
import org.springframework.stereotype.Component;

import static com.yclxiao.flinkcdcdemo.global.GlobalParameter.*;

/**
 * @author jyzxc
 * @since 2024-08-27
 */
@Component
public class MyJob implements Job {

    @Override
    public void execute(JobExecutionContext context) {
        // 获取传递的参数
        String description = context.getJobDetail().getJobDataMap().getString("description");
        String id = context.getJobDetail().getJobDataMap().getString("id");
        String key = context.getJobDetail().getJobDataMap().getString("name");
        // 生成要写入的 URL
        // 打印当前时间
        // System.out.println("Current time: " + System.currentTimeMillis());
        String url = description + "$$$" + id;
        // 向 Redis 列表中添加数据
        RedisConfig redisConfig = RedisConfig.getInstance();
        long listLength = redisConfig.getListLength(key);
        if (listLength >= MAX_LIST_SIZE) {
            // 如果列表长度超过 1000 条，打印日志或采取其他措施
            // System.out.println("Redis list is full. Data not written.");
        } else {
            redisConfig.getSyncCommands().rpush(key, url);
        }
    }
}
