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

import Constants from "../../common/constants";

/**
 * Utilities used for processing Constants related data.
 */
class TracingUtils {

    /**
     * Build a tree model using a spans list.
     *
     * @param {Array.<Span>} spansList The spans list from which the tree should be built
     * @returns {Span} The root span of the tree
     */
    static buildTree = (spansList) => {
        // Finding the root spans candidates (There can be one root span or two sibling root spans)
        const spanIdList = spansList.map((span) => span.spanId);
        const rootSpanCandidates = spansList.filter((span) => span.spanId === span.traceId
            || !spanIdList.includes(span.parentId));

        // Finding the root span and initializing current span
        let rootSpan;
        if (rootSpanCandidates.length === 1) { // Single root
            rootSpan = rootSpanCandidates[0];
        } else if (rootSpanCandidates.length === 2) { // Two routes with one client span and one server span
            let rootSpanIndex;
            if (rootSpanCandidates[0].isSiblingOf(rootSpanCandidates[1])) {
                if (rootSpanCandidates[0].isParentOf(rootSpanCandidates[1])) {
                    rootSpanIndex = 0;
                } else {
                    rootSpanIndex = 1;
                }
            } else {
                throw Error("Invalid Trace: Expected 1 root span, found two non-client kind root spans candidates.");
            }
            rootSpan = rootSpanCandidates[rootSpanIndex];
            rootSpanCandidates[0].sibling = rootSpanCandidates[1];
            rootSpanCandidates[1].sibling = rootSpanCandidates[0];
        } else {
            throw Error(`Invalid Trace: Expected 1 root span, found ${rootSpanCandidates.length} spans`);
        }

        // Fixing siblings kinds
        for (let i = 0; i < spansList.length; i++) {
            const span = spansList[i];
            let siblingSpan;
            for (let j = 0; j < spansList.length; j++) {
                if (i !== j && span.spanId === spansList[j].spanId) {
                    siblingSpan = spansList[j];
                }
            }
            if (siblingSpan) {
                if (!span.kind || !siblingSpan.kind) {
                    const setSpanKind = (span, kind) => {
                        if (!span.kind) {
                            span.kind = kind;
                            span.tags["span.kind"] = kind;
                        }
                    };
                    if (span.kind === Constants.Span.Kind.CLIENT
                        || siblingSpan.kind === Constants.Span.Kind.SERVER
                        || span.startTime < siblingSpan.startTime) {
                        setSpanKind(span, Constants.Span.Kind.CLIENT);
                        setSpanKind(siblingSpan, Constants.Span.Kind.SERVER);
                    } else {
                        setSpanKind(span, Constants.Span.Kind.SERVER);
                        setSpanKind(siblingSpan, Constants.Span.Kind.CLIENT);
                    }
                }
            } else {
                const unsetSpanKind = (span) => {
                    span.kind = null;
                    Reflect.deleteProperty(span.tags, "span.kind");
                };
                unsetSpanKind(span);
            }
        }

        // Adding references to the connected nodes
        for (let i = 0; i < spansList.length; i++) {
            for (let j = 0; j < spansList.length; j++) {
                if (i !== j) {
                    spansList[i].addSpanReference(spansList[j]);
                }
            }
        }

        // Calculating the tree depths
        rootSpan.walk((span, data) => {
            span.treeDepth = data;
            return data + 1;
        }, 0);

        return rootSpan;
    };

    /**
     * Traverse the span tree and label the nodes.
     *
     * @param {Span} tree The root span of the tree
     */
    static labelSpanTree = (tree) => {
        tree.walk((span, data) => {
            if (span.isFromIstioSystemComponent()) {
                span.componentType = Constants.ComponentType.ISTIO;
            } else if (span.isFromVICKSystemComponent()) {
                span.componentType = Constants.ComponentType.VICK;
            } else {
                span.componentType = Constants.ComponentType.MICROSERVICE;
            }

            if (span.isFromCellGateway()) {
                span.cell = span.getCell();
                span.serviceName = `${span.cell.name}-cell-gateway`;
            } else if (span.componentType !== Constants.ComponentType.ISTIO) {
                span.cell = data;
            }

            return span.cell;
        }, null);
    };

    /**
     * Traverse the span tree and generate a list of ordered spans.
     *
     * @param {Span} tree The root span of the tree
     * @returns {Array.<Span>} The list of spans ordered by time and tree structure
     */
    static getOrderedList = (tree) => {
        const spanList = [];
        tree.walk((span) => {
            spanList.push(span);
        });
        return spanList;
    };

    /**
     * Reset the tree references to one another resulting in the destruction of the tree structure.
     * This is required when the tree needs to be built again with different connections.
     *
     * @param {Array.<Span>} spans The list of spans to reset
     */
    static resetTreeSpanReferences = (spans) => {
        for (let i = 0; i < spans.length; i++) {
            spans[i].resetSpanReferences();
        }
    };

    /**
     * Remove a span from the tree preserving the tree structure.
     *
     * @param {Span} spanToBeRemoved The span to be removed
     */
    static removeSpanFromTree = (spanToBeRemoved) => {
        const parent = spanToBeRemoved.parent;
        if (parent) {
            parent.children.delete(spanToBeRemoved);
        }
        spanToBeRemoved.children.forEach((child) => {
            if (parent) {
                parent.children.add(child);
            }
            child.parent = parent;
        });
        if (spanToBeRemoved.sibling) {
            spanToBeRemoved.sibling.sibling = null;
        }
    };

}

export default TracingUtils;
