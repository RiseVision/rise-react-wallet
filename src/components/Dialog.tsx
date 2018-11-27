import MuiDialog from '@material-ui/core/Dialog';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactElement } from 'react';
import { inject, observer } from 'mobx-react';
import ModalPaperHeader from './ModalPaperHeader';
import autoId from '../utils/autoId';
import { PropsOf } from '../utils/metaTypes';
import RootStore, { RouteLink } from '../stores/root';

const styles = (theme: Theme) =>
  createStyles({
    paper: {
      display: 'block',
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 10,
      marginRight: 10,
      maxWidth: 500,
      // TODO required for ios
      ...(window.innerWidth > 500 ? { overflowY: 'initial' } : null)
    }
  });

type BaseProps = PropsOf<typeof MuiDialog> & WithStyles<typeof styles>;

interface Props extends BaseProps {
  onClose?: (ev?: React.SyntheticEvent<{}>) => void;
  closeLink?: RouteLink;
  onNavigateBack?: (ev?: React.SyntheticEvent<{}>) => void;
  navigateBackLink?: RouteLink;
  children: ReactElement<DialogContentProps>;
}

interface PropsInjected extends Props {
  store: RootStore;
}

interface State {
  title: string | JSX.Element;
  childContentId: null | string;
}

const stylesDecorator = withStyles(styles);

@inject('store')
@observer
class Dialog extends React.Component<Props, State> {
  @autoId dialogTitleId: string;
  @autoId dialogContentId: string;

  state = {
    title: '',
    childContentId: null
  };

  get injected(): PropsInjected {
    return this.props as PropsInjected;
  }

  setDialogContent = (dc: DialogContent) => {
    this.setState({
      title: dc.title,
      childContentId: dc.contentId || null
    });
  }

  handleCloseDialog = (ev: React.SyntheticEvent<{}>) => {
    const { onClose, closeLink, store } = this.injected;

    if (closeLink) {
      store.navigateTo(closeLink);
    } else if (onClose) {
      onClose(ev);
    }
  }

  render() {
    const {
      classes,
      onClose,
      closeLink,
      onNavigateBack,
      navigateBackLink,
      children,
      ...others
    } = this.injected;
    const { title, childContentId } = this.state;

    return (
      <MuiDialog
        aria-labelledby={this.dialogTitleId}
        aria-describedby={childContentId || this.dialogContentId}
        onClose={onClose || closeLink ? this.handleCloseDialog : undefined}
        classes={{
          paper: classes.paper
        }}
        maxWidth={false}
        {...others}
      >
        <ModalPaperHeader
          closeLink={closeLink}
          onCloseClick={onClose}
          backLink={navigateBackLink}
          onBackClick={onNavigateBack}
          children={title}
        />
        <div
          id={this.dialogContentId}
          key={children.key !== null ? children.key : undefined}
        >
          {React.cloneElement(children, {
            setDialogContent: this.setDialogContent
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
