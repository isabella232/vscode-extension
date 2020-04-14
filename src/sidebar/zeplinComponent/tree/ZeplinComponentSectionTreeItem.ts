import * as vscode from "vscode";
import TreeItem from "../../../common/vscode/tree/TreeItem";
import ZeplinComponentSection from "../../../common/domain/zeplinComponent/model/ZeplinComponentSection";
import { createList } from "./zeplinComponentTreeUtil";
import TreeItemContextProvider from "../../../common/vscode/tree/TreeItemContextProvider";
import TreeItemContext from "../../../common/domain/tree/TreeItemContext";

const contextProvider = new TreeItemContextProvider(
    TreeItemContext.ZeplinComponentSection,
    TreeItemContext.ZeplinLink
);

export default class ZeplinComponentSectionTreeItem extends TreeItem {
    public constructor(public section: ZeplinComponentSection) {
        super(section.name, contextProvider, vscode.TreeItemCollapsibleState.Collapsed);
    }

    public getChildren(): Promise<TreeItem[]> {
        return Promise.resolve(createList(this.section.components, this.section.componentSections));
    }
}
