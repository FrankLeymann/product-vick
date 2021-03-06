/*
 *  Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *  WSO2 Inc. licenses this file to you under the Apache License,
 *  Version 2.0 (the "License"); you may not use this file except
 *  in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
package org.wso2.vick.observability.model.generator.internal;

import com.google.common.graph.MutableNetwork;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import org.apache.log4j.Logger;
import org.wso2.carbon.datasource.core.exception.DataSourceException;
import org.wso2.vick.observability.model.generator.Node;
import org.wso2.vick.observability.model.generator.exception.GraphStoreException;

import java.lang.reflect.Type;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import javax.sql.DataSource;

/**
 * This handles the communication between the Graph datasource, and the rest of the other components.
 */
public class GraphStoreManager {
    private static final Logger log = Logger.getLogger(GraphPeriodicProcessor.class);

    private static final String TABLE_NAME = "DEPENDENCY_MODEL";
    private static final String DATASOURCE_NAME = "DEPENDENCY_DATASOURCE";
    private static final Type NODE_SET_TYPE = new TypeToken<HashSet<Node>>() {
    }.getType();
    private static final Type STRING_SET_TYPE = new TypeToken<HashSet<String>>() {
    }.getType();
    private DataSource dataSource;
    private Gson gson;

    public GraphStoreManager() {
        try {
            this.dataSource = (DataSource) ServiceHolder.getDataSourceService().getDataSource(DATASOURCE_NAME);
            createTable();
            this.gson = new Gson();
        } catch (DataSourceException e) {
            log.error("Unable to load the datasource : " + DATASOURCE_NAME +
                    " , and hence unable to schedule the periodic dependency persistence.", e);
        } catch (SQLException e) {
            log.error("Unable to create the table in " + DATASOURCE_NAME +
                    " , and hence unable to schedule the periodic dependency persistence.", e);
        }
    }

    private void createTable() throws SQLException {
        Connection connection = getConnection();
        PreparedStatement statement = connection.prepareStatement("CREATE TABLE IF NOT EXISTS " + TABLE_NAME +
                " (MODEL_TIME TIMESTAMP, NODES TEXT, EDGES TEXT)");
        statement.execute();
        cleanupConnection(null, statement, connection);
    }

    public Object[] loadGraph() throws GraphStoreException {
        try {
            Connection connection = getConnection();
            PreparedStatement statement = connection.prepareStatement("SELECT * FROM " + TABLE_NAME
                    + " ORDER BY MODEL_TIME DESC LIMIT 1");
            ResultSet resultSet = statement.executeQuery();
            Object[] returnObj = null;
            if (resultSet.next()) {
                String nodes = resultSet.getString(2);
                String edges = resultSet.getString(3);
                Set<Node> nodesSet = gson.fromJson(nodes, NODE_SET_TYPE);
                Set<String> edgeSet = gson.fromJson(edges, STRING_SET_TYPE);
                returnObj = new Object[2];
                returnObj[0] = nodesSet;
                returnObj[1] = edgeSet;
            }
            cleanupConnection(resultSet, statement, connection);
            return returnObj;
        } catch (SQLException ex) {
            throw new GraphStoreException("Unable to load the graph from datasource : " + DATASOURCE_NAME, ex);
        }
    }

    private Connection getConnection() throws SQLException {
        return this.dataSource.getConnection();
    }

    private void cleanupConnection(ResultSet rs, Statement stmt, Connection conn) {
        if (rs != null) {
            try {
                rs.close();
            } catch (SQLException e) {
                log.error("Error on closing resultSet " + e.getMessage(), e);
            }
        }
        if (stmt != null) {
            try {
                stmt.close();
            } catch (SQLException e) {
                log.error("Error on closing statement " + e.getMessage(), e);
            }
        }
        if (conn != null) {
            try {
                conn.close();
            } catch (SQLException e) {
                log.error("Error on closing connection " + e.getMessage(), e);
            }
        }
    }

    public Object[] persistGraph(MutableNetwork<Node, String> graph) throws GraphStoreException {
        try {
            String nodes = gson.toJson(graph.nodes(), NODE_SET_TYPE);
            String edges = gson.toJson(graph.edges(), STRING_SET_TYPE);
            Connection connection = getConnection();
            PreparedStatement statement = connection.prepareStatement("INSERT INTO " + TABLE_NAME
                    + " VALUES (?, ?, ?)");
            statement.setTimestamp(1, Timestamp.from(Instant.now()));
            statement.setString(2, nodes);
            statement.setString(3, edges);
            statement.executeUpdate();
            connection.commit();
            Object[] persistedModel = new Object[2];
            persistedModel[0] = graph.nodes();
            persistedModel[1] = graph.edges();
            cleanupConnection(null, statement, connection);
            return persistedModel;
        } catch (SQLException ex) {
            throw new GraphStoreException("Unable to persist the graph to the datasource: " + DATASOURCE_NAME, ex);
        }
    }

}
