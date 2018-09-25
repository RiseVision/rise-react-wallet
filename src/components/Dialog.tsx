import { Omit } from '@material-ui/core';
import MuiDialog from '@material-ui/core/Dialog';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactElement, ReactEventHandler } from 'react';
import { inject, observer } from 'mobx-react';
import { RouterStore } from 'mobx-router';
import ModalPaperHeader from './ModalPaperHeader';
import Link from './Link';
import autoId from '../utils/autoId';
import RootStore from '../stores/root';
import { PropsOf } from '../utils/metaTypes';

type LinkProps = Omit<PropsOf<typeof Link>, 'children'>;

const styles = (theme: Theme) => createStyles({
  paper: {
    overflowY: 'initial',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 10,
    marginRight: 10,
    maxWidth: 500
  },
});

type BaseProps = PropsOf<typeof MuiDialog>
  & WithStyles<typeof styles>;

interface Props extends BaseProps {
  closeLinkProps?: LinkProps;
  onNavigateBack?: ReactEventHandler<{}>;
  navigateBackLinkProps?: LinkProps;
  children: ReactElement<DialogContentProps>;
}

interface PropsInjected extends Props {
  store: RootStore;
  routerStore: RouterStore;
}

interface State {
  title: string | JSX.Element;
  childContentId: null | string;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@inject('routerStore')
@observer
class Dialog extends React.Component<Props, State> {
  @autoId dialogTitleId: string;
  @autoId dialogContentId: string;

  state = {
    title: '',
    childContentId: null,
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  setDialogContent = (dc: DialogContent) => {
    this.setState({
      title: dc.title,
      childContentId: dc.contentId || null,
    });
  }

  handleCloseDialog = (ev: React.SyntheticEvent<{}>) => {
    const { onClose, closeLinkProps, store, routerStore } = this.injected;

    // If the linkProps are used instead of an event handler,
    // use the data from the props to direct the user to the
    // correct location
    if (closeLinkProps && closeLinkProps.view) {
      routerStore.goTo(
        closeLinkProps.view,
        closeLinkProps.params || {},
        store,
        closeLinkProps.queryParams || {}
      );
    } else if (onClose) {
      onClose(ev);
    }
  }

  render() {
    const {
      classes,
      onClose,
      closeLinkProps,
      onNavigateBack,
      navigateBackLinkProps,
      children,
      ...others
    } = this.injected;
    const { title, childContentId } = this.state;

    return (
      <MuiDialog
        aria-labelledby={this.dialogTitleId}
        aria-describedby={childContentId || this.dialogContentId}
        onClose={onClose || closeLinkProps ? this.handleCloseDialog : undefined}
        classes={{
          paper: classes.paper,
        }}
        maxWidth={false}
        {...others}
      >
        <ModalPaperHeader
          closeLinkProps={closeLinkProps}
          onCloseClick={onClose}
          backLinkProps={navigateBackLinkProps}
          onBackClick={onNavigateBack}
          children={title}
        />
        <div
          id={this.dialogContentId}
          key={children.key !== null ? children.key : undefined}
        >
          {React.cloneElement(children, {
            setDialogContent: this.setDialogContent,
          })}
        </div>
      </MuiDialog>
    );
  }
}

export default stylesDecorator(Dialog);

export interface DialogContentProps {
  setDialogContent?: (value: DialogContent) => void;
}

export interface DialogContent {
  title: string | JSX.Element;
  contentId?: null | string;
}

export function SetDialogContent(
  component: React.Component<DialogContentProps>,
  content: DialogContent
) {
  const { setDialogContent } = component.props;

  if (setDialogContent) {
    setDialogContent(content);
  }
}
