import {
    observable,
    action
} from 'mobx';
import io from 'socket.io-client';
import _ from 'lodash';

import TreeModel from 'tree-model'

class RollStore {
    sc_log_socket = io('http://localhost:4002/');
    // future_vis_socket = io('http://localhost:4006/');

    // Trigger value
    @observable value = {};

    // Future triggers
    // @observable future_values = [];

    // Pattern Roll Window parameters
    @observable resolution = 12;
    @observable cycles = 8;

    @observable dimensions_g = [200, 200];
    @observable dimensions_c = [200, 200];

    // pat roll
    @observable roll_canvas_element;
    @observable tree_start_cycle = 0;

    @observable treeRoot = null;
    @observable tree;

    constructor() {
        let ctx = this;

        // init tree
        this.tree = new TreeModel();

        // Sample value on trigger;
        this.sc_log_socket.on("/sclog", action((data) => {
            data.trigger['rendered'] = false;
            ctx.value = data.trigger;

            // -- init canvas 
            if (this.roll_canvas_element === null || this.roll_canvas_element === undefined) {
                this.roll_canvas_element = document.getElementById("pat_roll");
                // -- process data 
                this.processData();
    
    
                // -- render
                //  see if channel is new
                //          clear everything
                //      else
                //          if s is new
                //              clear channel portion of the window and redraw channel 
                //          else
                //              if n new
                //                  clear n portion and redraw
                //              else
                this.renderCanvas();
            }
        }))

        // -- Future samples on execution
        // this.future_vis_socket.on('connect', (reason) => {
        //     console.log("Port 4006 Connected: ", reason);
        // });
        // this.future_vis_socket.on('disconnect', action((reason) => {
        //     console.log("Port 4006 Disconnected: ", reason);
        // }));
        // this.future_vis_socket.on("/vis", action((data) => {
        //     console.log("Processed Data: ", data);
        //     this.canvas_data = data;

        //     // refreshes the data for canvas
        //     this.updateCanvas();
        // }))
    }

    // -- Module interaction
    @action updateCycles(c) {
        this.cycles = c;
    }
    @action updateResolution(r) {
        this.resolution = r;
    }

    // -- The dimensions 
    @action updateCanvasDimensions() {
        const element = document.getElementById('canvasLayout');
        if (element && element !== null) {
            const w = element.clientWidth;
            const h = element.clientHeight;

            this.dimensions_c = [w, h - 55];
            return;
        }
        this.dimensions_c = [800, 300];
    }
    @action updateGraphicsDimensions() {
        const element = document.getElementById('graphicsLayout');
        if (element && element !== null) {
            const w = element.clientWidth;
            const h = element.clientHeight;

            this.dimensions_g = [w, h - 40];
            return;
        }
        this.dimensions_g = [400, 400];
    }

    // -- Hot reload
    @action reloadRoll() {
        this.tree_start_cycle = _.toInteger(this.value.cycle);

        this.updateGraphicsDimensions();
        this.updateCanvasDimensions();
    }

    // --Canvas functions 
    @action processData() {

        const node = {
            type: 'channel',
            value: _.toNumber(this.value.sirenChan),
            children: [{
                type: 'sample',
                value: this.value.s,
                children: [{
                    type: 'note',
                    value: this.value.n,
                    time: [this.value]
                }]
            }]
        };

        // initialize start cycle
        if (this.tree_start_cycle === 0) {
            this.tree_start_cycle = _.toInteger(this.value.cycle);
        }

        // reset time
        if (this.value.cycle > this.cycles + this.tree_start_cycle) {
            // delete all nodes
            this.treeRoot = null;
            this.tree_start_cycle = _.toInteger(this.value.cycle);
        }

        // if its empty
        if (this.treeRoot === null) {
            this.treeRoot = this.tree.parse({
                type: 'root',
                value: -1,
                children: [node]
            });
        }

        let channel_node;
        let sample_node;
        let note_node;

        channel_node = this.treeRoot.first({
            strategy: 'breadth'
        }, (n) => {
            if (n.model.type === 'channel' && n.model.value === node.value) {
                return true;
            }
            return false;
        });
        if (channel_node === undefined) {
            channel_node = this.treeRoot.addChild(this.tree.parse(node));
        } else {
            sample_node = channel_node.first({
                strategy: 'breadth'
            }, (n) => {
                if (n.model.type === 'sample' && n.model.value === this.value.s) {
                    return true;
                }
                return false;
            });
            if (sample_node === undefined) {
                sample_node = channel_node.addChild(this.tree.parse(node.children[0]));
            } else {
                note_node = sample_node.first({
                    strategy: 'breadth'
                }, (n) => {
                    if (n.model.type === 'note' && n.model.value === this.value.n) {
                        return true;
                    }
                    return false;
                });
                if (note_node === undefined) {
                    sample_node.addChild(this.tree.parse(node.children[0].children[0]));
                } else {
                    note_node.model.time.push(this.value);
                }
            }
        }
    }

    @action renderCanvas() {
        let ctx = this.roll_canvas_element.getContext("2d", {
            alpha: false
        });

        this.updateCanvasDimensions();
        let w = this.roll_canvas_element.width = this.dimensions_c[0];
        let h = this.roll_canvas_element.height = this.dimensions_c[1];

        // background
        for (let i = 0; i < this.treeRoot.children.length; i++) {
            i % 2 === 0 ? ctx.fillStyle = "rgb(50, 50, 50)" : ctx.fillStyle = "rgb(40, 40, 40)";

            ctx.fillRect(
                0,
                _.toInteger(h / (this.treeRoot.children.length) * i),
                w,
                _.toInteger(h / (this.treeRoot.children.length))
            );
        }

        // nodes
        this.treeRoot.walk({
            strategy: 'post'
        }, (n) => {
            // leaf node
            if (!n.hasChildren()) {
                const path = n.getPath();

                const _w = w / (this.cycles * this.resolution);
                const _c_h = h / (path[0].children.length);
                const _c_i = path[1].getIndex();
                const _s_h = _c_h / (path[1].children.length);
                const _s_i = path[2].getIndex();
                const _n_h = _s_h / (path[2].children.length);
                const _n_i = path[3].getIndex();

                ctx.fillStyle = "rgb(180, 180, 180)";
                ctx.strokeStyle = "#111"
                _.each(n.model.time, (item) => {
                    if (!item.rendered) {
                        ctx.fillStyle = "rgb(180, 180, 20)";
                        ctx.strokeStyle = "rgb(180, 0, 0)"
                        item.rendered = true;
                    }
                    ctx.fillRect(
                        _.toInteger(((item.cycle - this.tree_start_cycle) * this.resolution) * _w),
                        _.toInteger(_c_i * _c_h + _s_h * _s_i + _n_i * _n_h),
                        _.toInteger(_w),
                        _.toInteger(_n_h)
                    );
                })
            }
        });
    }
}

export default new RollStore();