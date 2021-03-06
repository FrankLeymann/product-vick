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

import AccountCircle from "@material-ui/icons/AccountCircle";
import AppBar from "@material-ui/core/AppBar";
import AuthUtils from "./pages/common/utils/authUtils";
import BarChart from "@material-ui/icons/BarChart";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloseIcon from "@material-ui/icons/Close";
import Collapse from "@material-ui/core/Collapse";
import CssBaseline from "@material-ui/core/CssBaseline";
import DesktopWindows from "@material-ui/icons/DesktopWindows";
import Divider from "@material-ui/core/Divider";
import Drawer from "@material-ui/core/Drawer";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import Grain from "@material-ui/icons/Grain";
import IconButton from "@material-ui/core/IconButton";
import InsertChartOutlined from "@material-ui/icons/InsertChartOutlined";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Menu from "@material-ui/core/Menu";
import MenuIcon from "@material-ui/icons/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import NotificationUtils from "./pages/common/utils/notificationUtils";
import PropTypes from "prop-types";
import React from "react";
import Snackbar from "@material-ui/core/Snackbar/Snackbar";
import Timeline from "@material-ui/icons/Timeline";
import Toolbar from "@material-ui/core/Toolbar";
import Typography from "@material-ui/core/Typography";
import classNames from "classnames";
import {withRouter} from "react-router-dom";
import {withStyles} from "@material-ui/core/styles";
import withGlobalState, {StateHolder} from "./pages/common/state";

const drawerWidth = 240;

const styles = (theme) => ({
    root: {
        display: "flex",
        flexGrow: 1,
        minHeight: "100%"
    },
    grow: {
        flexGrow: 1
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        })
    },
    appBarShift: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(["width", "margin"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    menuButton: {
        marginLeft: 12,
        marginRight: 20
    },
    hide: {
        display: "none"
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: "nowrap"
    },
    drawerOpen: {
        width: drawerWidth,
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerClose: {
        transition: theme.transitions.create("width", {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        overflowX: "hidden",
        width: theme.spacing.unit * 7 + 1,
        [theme.breakpoints.up("sm")]: {
            width: theme.spacing.unit * 9 + 1
        }
    },
    toolbar: {
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 8px",
        ...theme.mixins.toolbar
    },
    content: {
        position: "relative",
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
        minHeight: "100%"
    },
    progressOverlay: {
        position: "absolute",
        zIndex: 9999,
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgb(0, 0, 0, 0.5)"
    },
    progress: {
        textAlign: "center",
        margin: "auto"
    },
    progressIndicator: {
        margin: theme.spacing.unit * 2
    },
    progressContent: {
        fontSize: "large",
        fontWeight: 500,
        width: "100%",
        color: "#ffffff"
    },
    nested: {
        paddingLeft: theme.spacing.unit * 3
    },
    active: {
        color: theme.palette.primary.main,
        fontWeight: 500
    },
    list: {
        paddingTop: 0
    }
});

class AppLayout extends React.Component {

    constructor(props) {
        super(props);

        const pages = ["/", "/cells", "/tracing", "/system-metrics"];
        let selectedIndex = 0;
        for (let i = 0; i < pages.length; i++) {
            if (props.location.pathname.startsWith(pages[i])) {
                selectedIndex = i;
            }
        }

        props.globalState.addListener(StateHolder.LOADING_STATE, this.handleLoadingStateChange);
        props.globalState.addListener(StateHolder.NOTIFICATION_STATE, this.handleNotificationStateChange);

        const loadingState = props.globalState.get(StateHolder.LOADING_STATE);
        const notificationState = props.globalState.get(StateHolder.NOTIFICATION_STATE);
        this.state = {
            open: false,
            userInfo: null,
            subMenuOpen: false,
            loadingState: {
                ...loadingState
            },
            notificationState: {
                ...notificationState
            },
            selectedIndex: selectedIndex
        };
    }

    handleUserInfoMenuOpen = (event) => {
        this.setState({userInfo: event.currentTarget});
    };

    handleUserInfoMenuClose = () => {
        this.setState({userInfo: null});
    };

    handleDrawerOpen = () => {
        this.setState({open: true});
    };

    handleDrawerClose = () => {
        this.setState({open: false});
    };

    handleSystemMetricsNavSectionClick = () => {
        this.setState((prevState) => ({subMenuOpen: !prevState.subMenuOpen}));
    };

    handleNavItemClick = (nav, event) => {
        const {history} = this.props;

        this.setState({
            selectedIndex: Number(event.currentTarget.attributes.index.value)
        });
        history.push(nav, {
            hideBackButton: true
        });
    };

    handleLoadingStateChange = (loadingStateKey, oldState, newState) => {
        this.setState({
            loadingState: {
                isLoading: newState.isLoading,
                message: newState.message
            }
        });
    };

    handleNotificationStateChange = (notificationStateKey, oldState, newState) => {
        this.setState({
            notificationState: {
                isOpen: newState.isOpen,
                message: newState.message,
                notificationLevel: newState.notificationLevel
            }
        });
    };

    handleNotificationClose = () => {
        NotificationUtils.closeNotification(this.props.globalState);
    };

    render = () => {
        const {classes, children, theme, globalState} = this.props;
        const {open, userInfo, loadingState, selectedIndex} = this.state;
        const userInfoOpen = Boolean(userInfo);
        return (
            <div className={classes.root}>
                <CssBaseline/>
                <AppBar position="fixed"
                    className={classNames(classes.appBar, {
                        [classes.appBarShift]: open
                    })}>
                    <Toolbar disableGutters={!open}>
                        <IconButton color="inherit" aria-label="Open drawer"
                            onClick={this.handleDrawerOpen}
                            className={classNames(classes.menuButton, {
                                [classes.hide]: open
                            })}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="h6" color="inherit" className={classes.grow}>
                            WSO2 VICK Observability
                        </Typography>
                        {
                            globalState.get(StateHolder.USER)
                                ? (
                                    <div>
                                        <IconButton
                                            aria-owns={userInfoOpen ? "user-info-appbar" : undefined}
                                            aria-haspopup="true"
                                            onClick={this.handleUserInfoMenuOpen}
                                            color="inherit">
                                            <AccountCircle/>
                                        </IconButton>
                                        <Menu id="user-info-appbar" anchorEl={userInfo}
                                            anchorOrigin={{
                                                vertical: "top",
                                                horizontal: "right"
                                            }}
                                            transformOrigin={{
                                                vertical: "top",
                                                horizontal: "right"
                                            }}
                                            open={userInfoOpen}
                                            onClose={this.handleUserInfoMenuClose}>
                                            {/* TODO: Implement user login */}
                                            <MenuItem onClick={this.handleUserInfoMenuClose}>
                                                Profile - {globalState.get(StateHolder.USER)}
                                            </MenuItem>
                                            <MenuItem onClick={this.handleUserInfoMenuClose}>
                                                My account
                                            </MenuItem>
                                            <MenuItem onClick={() => {
                                                AuthUtils.signOut(globalState);
                                            }}>
                                                Logout
                                            </MenuItem>
                                        </Menu>
                                    </div>
                                )
                                : null
                        }
                    </Toolbar>
                </AppBar>
                <Drawer variant="permanent"
                    className={classNames(classes.drawer, {
                        [classes.drawerOpen]: this.state.open,
                        [classes.drawerClose]: !this.state.open
                    })}
                    classes={{
                        paper: classNames({
                            [classes.drawerOpen]: this.state.open,
                            [classes.drawerClose]: !this.state.open
                        })
                    }}
                    open={this.state.open}>
                    <div className={classes.toolbar}>
                        <IconButton onClick={this.handleDrawerClose}>
                            {theme.direction === "rtl" ? <ChevronRightIcon/> : <ChevronLeftIcon/>}
                        </IconButton>
                    </div>
                    <Divider/>
                    <List className={classes.list}>
                        <ListItem index={0} button key="Overview"
                            className={classNames({[classes.active]: selectedIndex === 0})}
                            onClick={(event) => {
                                this.handleNavItemClick("/", event);
                            }}>
                            <ListItemIcon>
                                <DesktopWindows className={classNames({[classes.active]: selectedIndex === 0})}/>
                            </ListItemIcon>
                            <ListItemText primary="Overview"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 0})}}/>
                        </ListItem>
                        <ListItem index={1} button key="Cells"
                            className={classNames({[classes.active]: selectedIndex === 1})}
                            onClick={(event) => {
                                this.handleNavItemClick("/cells", event);
                            }}>
                            <ListItemIcon>
                                <Grain className={classNames({[classes.active]: selectedIndex === 1})}/>
                            </ListItemIcon>
                            <ListItemText primary="Cells"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 1})}}/>
                        </ListItem>
                        <ListItem index={2} button key="Distributed Tracing"
                            className={classNames({[classes.active]: selectedIndex === 2})}
                            onClick={(event) => {
                                this.handleNavItemClick("/tracing", event);
                            }}>
                            <ListItemIcon>
                                <Timeline className={classNames({[classes.active]: selectedIndex === 2})}/>
                            </ListItemIcon>
                            <ListItemText primary="Distributed Tracing"
                                classes={{primary: classNames({[classes.active]: selectedIndex === 2})}}/>
                        </ListItem>
                        <ListItem button onClick={this.handleSystemMetricsNavSectionClick}>
                            <ListItemIcon>
                                <InsertChartOutlined/>
                            </ListItemIcon>
                            <ListItemText inset primary="System Metrics"/>
                            {this.state.subMenuOpen ? <ExpandLess/> : <ExpandMore/>}
                        </ListItem>
                        <Collapse in={this.state.subMenuOpen} timeout="auto" unmountOnExit>
                            <List component="div" disablePadding>
                                <ListItem index={3} button key="ControlPlane"
                                    className={classNames({[classes.active]: selectedIndex === 3}, classes.nested)}
                                    onClick={(event) => {
                                        this.handleNavItemClick("/system-metrics/control-plane", event);
                                    }}>
                                    <ListItemIcon>
                                        <BarChart className={classNames({[classes.active]: selectedIndex === 3})}/>
                                    </ListItemIcon>
                                    <ListItemText inset primary="Global Control Plane"
                                        classes={{primary: classNames({[classes.active]: selectedIndex === 3})}}/>
                                </ListItem>
                                <ListItem index={4} button key="PodUsage"
                                    className={classNames({[classes.active]: selectedIndex === 4}, classes.nested)}
                                    onClick={(event) => {
                                        this.handleNavItemClick("/system-metrics/pod-usage", event);
                                    }}>
                                    <ListItemIcon>
                                        <BarChart className={classNames({[classes.active]: selectedIndex === 4})}/>
                                    </ListItemIcon>
                                    <ListItemText inset primary="Pod Usage"
                                        classes={{primary: classNames({[classes.active]: selectedIndex === 4})}}/>
                                </ListItem>
                                <ListItem index={5} button key="NodeUsage"
                                    className={classNames({[classes.active]: selectedIndex === 5}, classes.nested)}
                                    onClick={(event) => {
                                        this.handleNavItemClick("/system-metrics/node-usage", event);
                                    }}>
                                    <ListItemIcon>
                                        <BarChart className={classNames({[classes.active]: selectedIndex === 5})}/>
                                    </ListItemIcon>
                                    <ListItemText inset primary="Node Usage"
                                        classes={{primary: classNames({[classes.active]: selectedIndex === 5})}}/>
                                </ListItem>
                            </List>
                        </Collapse>
                    </List>
                </Drawer>
                <main className={classes.content}>
                    <div className={classes.progressOverlay} style={{
                        display: loadingState.isLoading ? "grid" : "none"
                    }}>
                        <div className={classes.progress}>
                            <CircularProgress className={classes.progressIndicator} thickness={4.5} size={45}/>
                            <div className={classes.progressContent}>
                                {loadingState.message ? loadingState.message : "Loading"}...
                            </div>
                        </div>
                    </div>
                    {children}
                </main>
                <Snackbar
                    anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left"
                    }}
                    open={this.state.notificationState.isOpen}
                    autoHideDuration={5000}
                    onClose={this.handleNotificationClose}
                    ContentProps={{"aria-describedby": "message-id"}}
                    message={this.state.notificationState.message}
                    action={[
                        <IconButton key="close" aria-label="Close" color="inherit"
                            onClick={this.handleNotificationClose}>
                            <CloseIcon/>
                        </IconButton>
                    ]}
                />
            </div>
        );
    };

}

AppLayout.propTypes = {
    classes: PropTypes.object.isRequired,
    children: PropTypes.any.isRequired,
    theme: PropTypes.object.isRequired,
    globalState: PropTypes.instanceOf(StateHolder).isRequired,
    history: PropTypes.any.isRequired,
    location: PropTypes.shape({
        pathname: PropTypes.string.isRequired
    })
};

export default withStyles(styles, {withTheme: true})(withRouter(withGlobalState(AppLayout)));
