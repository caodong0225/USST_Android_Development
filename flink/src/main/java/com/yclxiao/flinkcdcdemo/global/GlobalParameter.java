package com.yclxiao.flinkcdcdemo.global;

/**
 * <p>
 * 全局参数设置
 * </p>
 *
 * @author jyzxc
 * @since 2024-08-28
 */
public class GlobalParameter {
    // 更新为你的 Redis URI格式为：redis://password@host:port/db
    public static final String REDIS_URI = "redis://127.0.0.1:6379/0";
    // MySQL 配置
    public static String MYSQL_HOST = "localhost";
    public static int MYSQL_PORT = 3306;
    public static String MYSQL_USER = "root";
    public static String MYSQL_PASSWD = "123456";
    public static String SYNC_DB = "gotifydb";
    public static String SYNC_TABLES = "gotifydb.applications";
    public static int MAX_LIST_SIZE = 1000;
}
