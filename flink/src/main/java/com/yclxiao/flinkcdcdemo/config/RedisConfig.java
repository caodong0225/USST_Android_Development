package com.yclxiao.flinkcdcdemo.config;

import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.api.sync.RedisCommands;
import jakarta.annotation.PreDestroy;

import static com.yclxiao.flinkcdcdemo.global.GlobalParameter.REDIS_URI;

/**
 * @author jyzxc
 * @since 2024-08-28
 */
public class RedisConfig {

    private static volatile RedisConfig instance;
    private RedisClient redisClient;
    private StatefulRedisConnection<String, String> connection;
    private RedisCommands<String, String> syncCommands;

    // Private constructor to prevent instantiation
    private RedisConfig() {
        init();
    }

    // Static method to create and return the single instance
    public static RedisConfig getInstance() {
        if (instance == null) {
            synchronized (RedisConfig.class) {
                if (instance == null) {
                    instance = new RedisConfig();
                }
            }
        }
        return instance;
    }

    private void init() {
        if (syncCommands == null) {
            // Only initialize if not already initialized
            redisClient = RedisClient.create(REDIS_URI);
            connection = redisClient.connect();
            syncCommands = connection.sync();
        }
    }

    @PreDestroy
    public void close() {
        if (connection != null) {
            connection.close();
        }
        if (redisClient != null) {
            redisClient.shutdown();
        }
    }

    public RedisCommands<String, String> getSyncCommands() {
        return syncCommands;
    }

    // New method to get the length of a Redis list
    public long getListLength(String key) {
        return syncCommands.llen(key);
    }
}
