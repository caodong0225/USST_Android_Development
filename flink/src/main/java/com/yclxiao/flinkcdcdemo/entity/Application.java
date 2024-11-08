package com.yclxiao.flinkcdcdemo.entity;

import lombok.Data;

/**
 * Application 实体类
 * @author jyzxc
 * @since 2024-08-28
 */
@Data
public class Application {
    private Integer id;
    private String token;
    private Integer userId;
    private String name;
    private String description;
    private boolean enabled;
    private boolean isRunning;
    private Integer interval;
}
