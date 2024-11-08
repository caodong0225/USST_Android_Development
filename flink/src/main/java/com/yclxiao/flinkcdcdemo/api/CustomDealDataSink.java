package com.yclxiao.flinkcdcdemo.api;

import com.alibaba.fastjson.JSON;
import com.alibaba.fastjson.JSONObject;
import com.yclxiao.flinkcdcdemo.config.SchedulerSingleton;
import com.yclxiao.flinkcdcdemo.entity.Application;
import com.yclxiao.flinkcdcdemo.job.MyJob;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.streaming.api.functions.sink.RichSinkFunction;
import org.apache.flink.streaming.api.functions.sink.SinkFunction;
import org.quartz.*;
import java.util.Map;


/**
 * @author jyzxc
 */
public class CustomDealDataSink extends RichSinkFunction<String> {

    // Get the already initialized scheduler
    Scheduler scheduler;
    @Override
    public void open(Configuration parameters) throws Exception {
        // scheduler = SchedulerSingleton.getScheduler();
        SchedulerSingleton.initializeScheduler();
        scheduler = SchedulerSingleton.getScheduler();
        if (scheduler != null && !scheduler.isStarted()) {
            scheduler.start();
        }
    }

    @Override
    public void invoke(String value, SinkFunction.Context context) throws Exception {
        // 解析拿到的CDC-JSON数据
        // fastjson解析
        JSONObject jsonObject = JSON.parseObject(value);
        Application newApplication = parseApplication(jsonObject,"after");
        Application oldApplication = parseApplication(jsonObject, "before");
        if (newApplication != null) {
            switch (jsonObject.getString("op")) {
                case "c":
                    // insert
                    startJob(newApplication);
                    break;
                case "u":
                    // update
                    if (newApplication.isEnabled()) {
                        startJob(newApplication);
                    } else {
                        // 删除任务
                        deleteJob(newApplication);
                        break;
                    }
                    if(oldApplication != null)
                    {
                        if(!(oldApplication.getInterval().equals(newApplication.getInterval())
                        && oldApplication.isRunning() == newApplication.isRunning()
                        && oldApplication.isEnabled() == newApplication.isEnabled()
                        && oldApplication.getDescription().equals(newApplication.getDescription()))
                        )
                        {
                            // 更新任务
                            deleteJob(oldApplication);
                            startJob(newApplication);
                        }
                    }
                    break;
                default:
                    break;
            }
        }
        else if(oldApplication != null)
        {
            if("d".equals(jsonObject.getString("op")))
            {
                deleteJob(oldApplication);
            }
        }
    }

    @Override
    public void close() throws Exception {
        if (scheduler != null) {
            scheduler.shutdown();
        }
    }

    private Application parseApplication(JSONObject jsonObject, String status) {
        Map<String, Object> jsonObjectNew;
        if (jsonObject.get(status) == null) {
            //jsonObjectNew = jsonObject.getJSONObject("before");
            return null;
        } else {
            jsonObjectNew = jsonObject.getJSONObject(status);
        }
        Application application = new Application();
        application.setId((Integer) jsonObjectNew.get("id"));
        application.setToken((String) jsonObjectNew.get("token"));
        application.setUserId((Integer) jsonObjectNew.get("user_id"));
        application.setName((String) jsonObjectNew.get("name"));
        application.setDescription((String) jsonObjectNew.get("description"));
        application.setEnabled((Integer) jsonObjectNew.get("enabled") == 1);
        application.setRunning((Integer) jsonObjectNew.get("is_running") == 1);
        application.setInterval((Integer) jsonObjectNew.get("internal_time"));
        return application;
    }

    private void startJob(Application application) throws SchedulerException
    {
        deleteJob(application);
        // 是否启动
        if(application.isRunning())
        {
            JobDetail jobDetail = JobBuilder.newJob(MyJob.class)
                    .withIdentity("StartJob-" + application.getId())
                    .usingJobData("description", application.getDescription())
                    .usingJobData("isRunning", application.isRunning())
                    .usingJobData("id", application.getId())
                    .usingJobData("name", application.getName())
                    .storeDurably()
                    .build();

            // 定义Trigger
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity("StartTrigger-" + application.getId())
                    .withSchedule(SimpleScheduleBuilder.simpleSchedule()
                            .withIntervalInSeconds(application.getInterval())
                            .repeatForever())
                    .build();
            // 表明session没有失效
            scheduler.scheduleJob(jobDetail, trigger);
        }
    }

    private void deleteJob(Application application) throws SchedulerException
    {
        JobKey jobKey = JobKey.jobKey("StartJob-" + application.getId());
        if(scheduler.checkExists(jobKey))
        {
            scheduler.deleteJob(jobKey);
        }
    }
}
