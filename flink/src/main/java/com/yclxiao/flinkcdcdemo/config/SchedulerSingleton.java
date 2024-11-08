package com.yclxiao.flinkcdcdemo.config;

import lombok.Getter;
import org.quartz.Scheduler;
import org.quartz.SchedulerException;
import org.quartz.SchedulerFactory;
import org.quartz.impl.StdSchedulerFactory;

/**
 * <p>
 *     Scheduler单例设置
 * </p>
 * @author jyzxc
 * @since 2024-08-28
 */
public class SchedulerSingleton {
    @Getter
    private static Scheduler scheduler;

    // Method to initialize the scheduler
    public static void initializeScheduler() throws SchedulerException {
        if (scheduler == null) {
            SchedulerFactory schedulerFactory = new StdSchedulerFactory();
            scheduler = schedulerFactory.getScheduler();
            scheduler.start();
        }
    }
}