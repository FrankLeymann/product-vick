/*
 * Copyright (c) 2018, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import Button from "@material-ui/core/Button";
import ChipInput from "material-ui-chip-input";
import {ColorGenerator} from "../common/color";
import FormControl from "@material-ui/core/FormControl/FormControl";
import Grid from "@material-ui/core/Grid/Grid";
import HttpUtils from "../common/utils/httpUtils";
import InputAdornment from "@material-ui/core/InputAdornment/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel/InputLabel";
import MenuItem from "@material-ui/core/MenuItem/MenuItem";
import NotificationUtils from "../common/utils/notificationUtils";
import Paper from "@material-ui/core/Paper/Paper";
import PropTypes from "prop-types";
import QueryUtils from "../common/utils/queryUtils";
import React from "react";
import SearchResult from "./SearchResult";
import Select from "@material-ui/core/Select/Select";
import Span from "./utils/span";
import TextField from "@material-ui/core/TextField/TextField";
import TopToolbar from "../common/toptoolbar";
import Typography from "@material-ui/core/Typography/Typography";
import withStyles from "@material-ui/core/styles/withStyles";
import withGlobalState, {StateHolder} from "../common/state";

const styles = (theme) => ({
    container: {
        padding: theme.spacing.unit * 3
    },
    subheading: {
        marginBottom: theme.spacing.unit * 2
    },
    formControl: {
        marginBottom: theme.spacing.unit * 2
    },
    durationTextField: {
        marginTop: theme.spacing.unit * 2
    },
    startInputAdornment: {
        marginRight: theme.spacing.unit * 2,
        marginBottom: theme.spacing.unit * 2
    },
    searchForm: {
        marginBottom: Number(theme.spacing.unit)
    },
    resultContainer: {
        marginTop: theme.spacing.unit * 3
    }
});

class Search extends React.Component {

    static ALL_VALUE = "All";

    constructor(props) {
        super(props);
        const {location} = props;

        const queryParams = HttpUtils.parseQueryParams(location.search);
        this.state = Search.generateValidState({
            data: {
                cells: [],
                microservices: [],
                operations: []
            },
            filter: {
                cell: queryParams.cell ? queryParams.cell : Search.ALL_VALUE,
                microservice: queryParams.microservice ? queryParams.microservice : Search.ALL_VALUE,
                operation: queryParams.operation ? queryParams.operation : Search.ALL_VALUE,
                tags: queryParams.tags ? JSON.parse(queryParams.tags) : {},
                minDuration: queryParams.minDuration ? queryParams.minDuration : undefined,
                minDurationMultiplier: queryParams.minDurationMultiplier ? queryParams.minDurationMultiplier : 1,
                maxDuration: queryParams.maxDuration ? queryParams.maxDuration : undefined,
                maxDurationMultiplier: queryParams.maxDurationMultiplier ? queryParams.maxDurationMultiplier : 1
            },
            metaData: {
                availableMicroservices: [],
                availableOperations: []
            },
            hasSearchCompleted: false,
            searchResults: []
        });
    }

    componentDidMount = () => {
        const {location} = this.props;
        const queryParams = HttpUtils.parseQueryParams(location.search);
        let isQueryParamsEmpty = true;
        for (const key in queryParams) {
            if (queryParams.hasOwnProperty(key) && queryParams[key]) {
                isQueryParamsEmpty = false;
            }
        }

        if (!isQueryParamsEmpty) {
            this.search(true);
        }
    };

    render = () => {
        const {classes} = this.props;
        const {data, filter, metaData, hasSearchCompleted, searchResults} = this.state;

        const createMenuItemForSelect = (itemNames) => itemNames.map(
            (itemName) => (<MenuItem key={itemName} value={itemName}>{itemName}</MenuItem>)
        );

        const tagChips = [];
        for (const tagKey in filter.tags) {
            if (filter.tags.hasOwnProperty(tagKey)) {
                tagChips.push(`${tagKey}=${filter.tags[tagKey]}`);
            }
        }

        return (
            <React.Fragment>
                <TopToolbar title={"Distributed Tracing"} onUpdate={this.onGlobalRefresh}/>
                <Paper className={classes.container}>
                    <Typography variant="h6" color="inherit" className={classes.subheading}>
                        Search Traces
                    </Typography>
                    <Grid container justify={"flex-start"} className={classes.searchForm}>
                        <Grid container justify={"flex-start"} spacing={24}>
                            <Grid item xs={3}>
                                <FormControl className={classes.formControl} fullWidth={true}>
                                    <InputLabel htmlFor="cell" shrink={true}>Cell</InputLabel>
                                    <Select value={filter.cell} onChange={this.getChangeHandler("cell")}
                                        inputProps={{name: "cell", id: "cell"}}>
                                        <MenuItem key={Search.ALL_VALUE} value={Search.ALL_VALUE}>
                                            {Search.ALL_VALUE}
                                        </MenuItem>
                                        {createMenuItemForSelect(data.cells)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <FormControl className={classes.formControl} fullWidth={true}>
                                    <InputLabel htmlFor="microservice" shrink={true}>Microservice</InputLabel>
                                    <Select value={filter.microservice} onChange={this.getChangeHandler("microservice")}
                                        inputProps={{name: "microservice", id: "microservice"}}>
                                        <MenuItem key={Search.ALL_VALUE} value={Search.ALL_VALUE}>
                                            {Search.ALL_VALUE}
                                        </MenuItem>
                                        {createMenuItemForSelect(metaData.availableMicroservices)}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <FormControl className={classes.formControl} fullWidth={true}>
                                    <InputLabel htmlFor="operation" shrink={true}>Operation</InputLabel>
                                    <Select value={filter.operation} onChange={this.getChangeHandler("operation")}
                                        inputProps={{name: "operation", id: "operation"}}>
                                        <MenuItem key={Search.ALL_VALUE} value={Search.ALL_VALUE}>
                                            {Search.ALL_VALUE}
                                        </MenuItem>
                                        {createMenuItemForSelect(metaData.availableOperations)}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid container justify={"flex-start"} spacing={24}>
                        <Grid item xs={6}>
                            <FormControl className={classes.formControl} fullWidth={true}>
                                <ChipInput label="Tags" InputLabelProps={{shrink: true}} value={tagChips}
                                    onChange={this.handleTagsChange} onDelete={this.handleTagsChange}
                                    placeholder={"Eg: http.status_code=200"}
                                />
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl className={classes.formControl} fullWidth={true}>
                                <InputLabel htmlFor="min-duration" shrink={true}>Duration</InputLabel>
                                <TextField id="min-duration" value={filter.minDuration}
                                    className={classes.durationTextField}
                                    onChange={this.getChangeHandler("minDuration")} type="number"
                                    placeholder={"Eg: 10"}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment className={classes.startInputAdornment}
                                                variant="filled" position="start">Min</InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment variant="filled" position="end">
                                                <Select value={filter.minDurationMultiplier}
                                                    onChange={this.getChangeHandler("minDurationMultiplier")}
                                                    inputProps={{
                                                        name: "min-duration-multiplier",
                                                        id: "min-duration-multiplier"
                                                    }}>
                                                    <MenuItem value={1}>ms</MenuItem>
                                                    <MenuItem value={1000}>s</MenuItem>
                                                </Select></InputAdornment>
                                        )
                                    }}/>
                            </FormControl>
                        </Grid>
                        <Grid item xs={3}>
                            <FormControl className={classes.formControl} fullWidth={true}>
                                <TextField id="max-duration" value={filter.maxDuration}
                                    className={classes.durationTextField}
                                    onChange={this.getChangeHandler("maxDuration")} type="number"
                                    placeholder={"Eg: 1,000"}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment className={classes.startInputAdornment}
                                                variant="filled" position="start">Max</InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment variant="filled" position="end">
                                                <Select value={filter.maxDurationMultiplier}
                                                    onChange={this.getChangeHandler("maxDurationMultiplier")}
                                                    inputProps={{
                                                        name: "max-duration-multiplier",
                                                        id: "max-duration-multiplier"
                                                    }}>
                                                    <MenuItem value={1}>ms</MenuItem>
                                                    <MenuItem value={1000}>s</MenuItem>
                                                </Select>
                                            </InputAdornment>
                                        )
                                    }}/>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Button variant="contained" color="primary" onClick={this.onSearchButtonClick}>Search</Button>
                    {
                        hasSearchCompleted
                            ? (
                                <div className={classes.resultContainer}>
                                    <SearchResult data={searchResults}/>
                                </div>
                            )
                            : null
                    }
                </Paper>
            </React.Fragment>
        );
    };

    onSearchButtonClick = () => {
        const {history, match, location} = this.props;
        const {filter} = this.state;

        // Updating the URL to ensure that the user can come back to this page
        const searchString = HttpUtils.generateQueryParamString({
            ...filter,
            tags: JSON.stringify(filter.tags)
        });
        history.replace(match.url + searchString, {
            ...location.state
        });

        this.search(true);
    };

    onGlobalRefresh = (isUserAction) => {
        if (this.state.hasSearchCompleted) {
            this.search(isUserAction);
        }
        this.loadCellData(isUserAction && !this.state.hasSearchCompleted);
    };

    /**
     * Search for traces.
     * Call the backend and search for traces.
     *
     * @param {boolean} isUserAction Show the overlay while loading
     */
    loadCellData = (isUserAction) => {
        const {globalState} = this.props;
        const self = this;

        if (isUserAction) {
            NotificationUtils.showLoadingOverlay("Loading Cell Information", globalState);
        }
        HttpUtils.callSiddhiAppEndpoint(
            {
                url: "/cells",
                method: "POST"
            },
            globalState
        ).then((data) => {
            const cells = [];
            const microservices = [];
            const operations = [];

            for (let i = 0; i < data.length; i++) {
                const span = new Span(data[i]);
                const cell = span.getCell();

                const cellName = (cell ? cell.name : null);
                const serviceName = span.serviceName;
                const operationName = span.operationName;

                if (cellName) {
                    if (!cells.includes(cellName)) {
                        cells.push(cellName);
                    }
                    if (!microservices.map((service) => service.name).includes(serviceName)) {
                        microservices.push({
                            name: serviceName,
                            cell: cellName
                        });
                    }
                    if (!operations.map((operation) => operation.name).includes(operationName)) {
                        operations.push({
                            name: operationName,
                            microservice: serviceName,
                            cell: cellName
                        });
                    }
                }
            }

            self.setState((prevState) => Search.generateValidState({
                ...prevState,
                data: {
                    cells: cells,
                    microservices: microservices,
                    operations: operations
                }
            }));
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
            }
        }).catch(() => {
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
                NotificationUtils.showNotification(
                    "Failed to load Cell Data",
                    StateHolder.NotificationLevels.ERROR,
                    globalState
                );
            }
        });
    };

    /**
     * Get the on change handler for a particular state filter attribute.
     *
     * @param {string} name The name of the filter
     * @returns {Function} The on change handler
     */
    getChangeHandler = (name) => (event) => {
        this.setState((prevState) => Search.generateValidState({
            ...prevState,
            filter: {
                ...prevState.filter,
                [name]: event.target.value
            }
        }));
    };

    /**
     * Handle the tags changing in the search.
     *
     * @param {Array.<string>} chips The chips in the tag search input
     */
    handleTagsChange = (chips) => {
        const parseChip = (chip) => {
            const chipContent = chip.split("=");
            return {
                key: chipContent[0].trim(),
                value: chipContent[1].trim()
            };
        };

        // Generating tags object
        let tags;
        if (typeof chips === "string") { // Delete tag
            tags = {...this.state.filter.tags};
            const tag = parseChip(chips);
            Reflect.deleteProperty(tags, tag.key);
        } else { // Tag change
            tags = {};
            for (let i = 0; i < chips.length; i++) {
                const tag = parseChip(chips[i]);
                tags[tag.key] = tag.value;
            }
        }

        this.setState((prevState) => Search.generateValidState({
            ...prevState,
            filter: {
                ...prevState.filter,
                tags: tags
            }
        }));
    };

    search = (isUserAction) => {
        const {
            cell, microservice, operation, tags, minDuration, minDurationMultiplier, maxDuration, maxDurationMultiplier
        } = this.state.filter;
        const {globalState} = this.props;
        const self = this;

        // Build search object
        const search = {};
        const addSearchParam = (key, value) => {
            if (value && value !== Search.ALL_VALUE) {
                search[key] = value;
            }
        };
        addSearchParam("cellName", cell);
        addSearchParam("serviceName", microservice);
        addSearchParam("operationName", operation);
        addSearchParam("tags", JSON.stringify(Object.keys(tags).length > 0 ? tags : {}));
        addSearchParam("minDuration", minDuration * minDurationMultiplier);
        addSearchParam("maxDuration", maxDuration * maxDurationMultiplier);
        addSearchParam("queryStartTime",
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).startTime).valueOf());
        addSearchParam("queryEndTime",
            QueryUtils.parseTime(globalState.get(StateHolder.GLOBAL_FILTER).endTime).valueOf());

        if (isUserAction) {
            NotificationUtils.showLoadingOverlay("Searching for Traces", globalState);
        }
        HttpUtils.callSiddhiAppEndpoint(
            {
                url: "/tracing/search",
                method: "POST",
                data: search
            },
            globalState
        ).then((data) => {
            const traces = {};
            for (let i = 0; i < data.length; i++) {
                const dataItem = data[i];
                if (!traces[dataItem.traceId]) {
                    traces[dataItem.traceId] = {};
                }
                if (!traces[dataItem.traceId][dataItem.cellName]) {
                    traces[dataItem.traceId][dataItem.cellName] = {};
                }
                if (!traces[dataItem.traceId][dataItem.cellName][dataItem.serviceName]) {
                    traces[dataItem.traceId][dataItem.cellName][dataItem.serviceName] = {};
                }
                const info = traces[dataItem.traceId][dataItem.cellName][dataItem.serviceName];
                info.count = dataItem.count;
                info.rootServiceName = dataItem.rootServiceName;
                info.rootOperationName = dataItem.rootOperationName;
                info.rootStartTime = dataItem.rootStartTime;
                info.rootDuration = dataItem.rootDuration;
            }
            const fillResult = (cellName, services, result) => {
                for (const serviceName in services) {
                    if (services.hasOwnProperty(serviceName)) {
                        const info = services[serviceName];

                        const span = new Span({
                            cellName: cellName,
                            serviceName: serviceName
                        });
                        const cell = span.getCell();

                        let cellNameKey;
                        if (span.isFromVICKSystemComponent()) {
                            cellNameKey = ColorGenerator.VICK;
                        } else if (span.isFromIstioSystemComponent()) {
                            cellNameKey = ColorGenerator.ISTIO;
                        } else {
                            cellNameKey = cell.name;
                        }

                        result.rootServiceName = info.rootServiceName;
                        result.rootOperationName = info.rootOperationName;
                        result.rootStartTime = info.rootStartTime;
                        result.rootDuration = info.rootDuration;
                        result.services.push({
                            cellNameKey: cellNameKey,
                            serviceName: span.serviceName,
                            count: info.count
                        });
                    }
                }
            };
            const searchResults = [];
            for (const traceId in traces) {
                if (traces.hasOwnProperty(traceId)) {
                    const cells = traces[traceId];
                    const result = {
                        traceId: traceId,
                        services: []
                    };

                    for (const cellName in cells) {
                        if (cells.hasOwnProperty(cellName)) {
                            fillResult(cellName, cells[cellName], result);
                        }
                    }
                    searchResults.push(result);
                }
            }
            self.setState((prevState) => Search.generateValidState({
                ...prevState,
                hasSearchCompleted: true,
                searchResults: searchResults
            }));
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
            }
        }).catch(() => {
            if (isUserAction) {
                NotificationUtils.hideLoadingOverlay(globalState);
                NotificationUtils.showNotification(
                    "Failed to search for Traces",
                    StateHolder.NotificationLevels.ERROR,
                    globalState
                );
            }
        });
    };

    /**
     * Current state from which the new valid state should be generated.
     *
     * @param {Object} state The current state
     * @returns {Object} The new valid state
     */
    static generateValidState = (state) => {
        const {data, filter, metaData} = state;

        // Finding the available microservices to be selected
        const selectedCells = (filter.cell === Search.ALL_VALUE ? data.cells : [filter.cell]);
        const availableMicroservices = data.microservices
            .filter((microservice) => selectedCells.includes(microservice.cell))
            .map((microservice) => microservice.name);

        const selectedMicroservice = (filter.microservice && availableMicroservices.includes(filter.microservice))
            ? filter.microservice
            : Search.ALL_VALUE;

        // Finding the available operations to be selected
        const selectedMicroservices = (selectedMicroservice === Search.ALL_VALUE
            ? availableMicroservices
            : [selectedMicroservice]);
        const availableOperations = data.operations
            .filter((operation) => selectedMicroservices.includes(operation.microservice))
            .map((operation) => operation.name);

        const selectedOperation = (filter.operation && availableOperations.includes(filter.operation))
            ? filter.operation
            : Search.ALL_VALUE;

        return {
            ...state,
            filter: {
                ...filter,
                microservice: selectedMicroservice,
                operation: selectedOperation
            },
            metaData: {
                ...metaData,
                availableMicroservices: availableMicroservices,
                availableOperations: availableOperations
            }
        };
    };

}

Search.propTypes = {
    classes: PropTypes.object.isRequired,
    history: PropTypes.shape({
        replace: PropTypes.func.isRequired
    }),
    location: PropTypes.shape({
        search: PropTypes.string.isRequired
    }).isRequired,
    match: PropTypes.shape({
        url: PropTypes.string.isRequired
    }).isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired
};

export default withStyles(styles)(withGlobalState(Search));
