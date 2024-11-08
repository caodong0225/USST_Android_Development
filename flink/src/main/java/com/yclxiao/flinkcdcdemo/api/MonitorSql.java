package com.yclxiao.flinkcdcdemo.api;

import com.ververica.cdc.connectors.mysql.source.MySqlSource;
import com.ververica.cdc.debezium.JsonDebeziumDeserializationSchema;
import org.apache.flink.api.common.eventtime.WatermarkStrategy;
import org.apache.flink.configuration.Configuration;
import org.apache.flink.configuration.RestOptions;
import org.apache.flink.streaming.api.datastream.DataStreamSink;
import org.apache.flink.streaming.api.environment.StreamExecutionEnvironment;

import static com.yclxiao.flinkcdcdemo.global.GlobalParameter.*;


/**
 * @author jyzxc
 */
public class MonitorSql {


    public static void main(String[] args) throws Exception {
        // mysql的监听
        MySqlSource<String> mySqlSource = MySqlSource.<String>builder()
                .hostname(MYSQL_HOST)
                .port(MYSQL_PORT)
                .databaseList(SYNC_DB) // set captured database
                .tableList(SYNC_TABLES) // set captured table
                .username(MYSQL_USER)
                .password(MYSQL_PASSWD)
                .deserializer(new JsonDebeziumDeserializationSchema()) // converts SourceRecord to JSON String
                .build();
        Configuration configuration = new Configuration();
        configuration.setInteger(RestOptions.PORT, 8081);
        StreamExecutionEnvironment env = StreamExecutionEnvironment.getExecutionEnvironment(configuration);
        // env.setParallelism(1);
        env.enableCheckpointing(5*1000);

        DataStreamSink<String> cdcSource = env
                .fromSource(mySqlSource, WatermarkStrategy.noWatermarks(), "MySQL Source")
                .addSink(new CustomDealDataSink());
        env.execute();

    }

}
