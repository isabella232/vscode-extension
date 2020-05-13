import * as vscode from "vscode";
import TreeDataProvider from "../../../common/vscode/tree/TreeDataProvider";
import TreeItem from "../../../common/vscode/tree/TreeItem";
import { getSavedBarrels } from "../util/barrelUtil";
import { BarrelTreeItem } from "./BarrelTreeItem";
import ScreensTreeItem from "../../screen/tree/ScreensTreeItem";
import ScreenTreeItem from "../../screen/tree/ScreenTreeItem";
import JumpToTreeItem from "../../jumpTo/tree/JumpToTreeItem";
import Screen from "../../screen/model/Screen";
import Barrel from "../../../common/domain/barrel/Barrel";
import ScreenSectionTreeItem from "../../screen/tree/ScreenSectionTreeItem";
import ZeplinComponent from "../../../common/domain/zeplinComponent/model/ZeplinComponent";
import ZeplinComponentsTreeItem from "../../zeplinComponent/tree/ZeplinComponentsTreeItem";
import BarrelZeplinComponentsTreeItem from "../../zeplinComponent/tree/BarrelZeplinComponentsTreeItem";
import ZeplinComponentSectionTreeItem from "../../zeplinComponent/tree/ZeplinComponentSectionTreeItem";
import ZeplinComponentTreeItem from "../../zeplinComponent/tree/ZeplinComponentTreeItem";
import SidebarRefresher from "../../refresh/util/SidebarRefresher";

class BarrelTreeDataProvider extends TreeDataProvider {
    protected viewId = "zeplin.views.barrels";
    protected showCollapseAll = true;
    private eventEmitter = new vscode.EventEmitter<TreeItem>();

    public get onDidChangeTreeData(): vscode.Event<TreeItem> {
        return this.eventEmitter.event;
    }

    public refresh() {
        this.eventEmitter.fire();
    }

    public register(): vscode.Disposable {
        const disposables = [super.register()];
        disposables.push(
            this.treeView!.onDidChangeVisibility(({ visible }) => {
                if (visible) {
                    SidebarRefresher.requestRefresh();
                }
            })
        );
        return vscode.Disposable.from(...disposables);
    }

    public getRoots(): TreeItem[] {
        const savedBarrels = getSavedBarrels();
        return savedBarrels.length ? [JumpToTreeItem, ...savedBarrels.map(barrel => new BarrelTreeItem(barrel))] : [];
    }

    public revealBarrel(barrel: Barrel) {
        // Find barrel tree item
        const barrelTreeItem =
            this.getRoots().find(item => item instanceof BarrelTreeItem && item.barrel.id === barrel.id);

        this.reveal(barrelTreeItem, `Barrel: ${barrel.name}|${barrel.id}`);
    }

    public async revealScreen(screen: Screen, project: Barrel) {
        // Find project tree item
        const projectTreeItem =
            this.getRoots().find(item => item instanceof BarrelTreeItem && item.barrel.id === project.id);

        // Find screens tree item
        const screensTreeItem = (await projectTreeItem?.getChildren())?.find(item => item instanceof ScreensTreeItem);

        let screensContainer = await screensTreeItem?.getChildren();

        // Find section tree item of screen if it is not in default section
        if (screen.sectionId) {
            screensContainer = await screensContainer
                ?.find(item => item instanceof ScreenSectionTreeItem && screen.sectionId === item.section.id)
                ?.getChildren();
        }

        // Find screen tree item
        const screenTreeItem = screensContainer
            ?.find(item => item instanceof ScreenTreeItem && item.screen._id === screen._id);

        this.reveal(screenTreeItem, `Screen: ${screen.name}|${screen._id}`);
    }

    public async revealComponent(component: ZeplinComponent, barrel: Barrel) {
        // Find barrel tree item
        const barrelTreeItem =
            this.getRoots().find(item => item instanceof BarrelTreeItem && item.barrel.id === barrel.id);

        // Find components tree item
        const componentsTreeItem =
            (await barrelTreeItem?.getChildren())?.find(item => item instanceof ZeplinComponentsTreeItem);

        let componentsContainer = await componentsTreeItem?.getChildren();

        // Find barrel components tree item is there is parent styleguides of barrel
        const barrelComponentsTreeItem = componentsContainer
            ?.find(item => item instanceof BarrelZeplinComponentsTreeItem && item.barrel.id === component.barrelId);
        if (barrelComponentsTreeItem) {
            componentsContainer = await barrelComponentsTreeItem?.getChildren();
        }

        // Traverse through section tree items
        for (const sectionId of component.sectionIds) {
            componentsContainer = await componentsContainer
                ?.find(item => item instanceof ZeplinComponentSectionTreeItem && sectionId === item.section._id)
                ?.getChildren();
        }

        // Find component tree item
        const componentTreeItem = componentsContainer
            ?.find(item => item instanceof ZeplinComponentTreeItem && item.zeplinComponent._id === component._id);

        this.reveal(componentTreeItem, `Component: ${component.name}|${component._id}`);
    }
}

export default new BarrelTreeDataProvider();
