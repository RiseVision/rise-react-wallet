import MuiDialog from '@material-ui/core/Dialog';
import {
  createStyles,
  Theme,
  WithStyles,
  withStyles
} from '@material-ui/core/styles';
import * as React from 'react';
import { ReactElement, ReactEventHandler } from 'react';
import ModalPaperHeader from './ModalPaperHeader';
import autoId from '../utils/autoId';
import { PropsOf } from '../utils/metaTypes';

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
  onNavigateBack?: ReactEventHandler<{}>;
  children: ReactElement<DialogContentProps>;
}

interface State {
  title: string | JSX.Element;
  childContentId: null | string;
}

const stylesDecorator = withStyles(styles);

class Dialog extends React.PureComponent<Props, State> {
  @autoId dialogTitleId: string;
  @autoId dialogContentId: string;

  state = {
    title: '',
    childContentId: null,
  };

  setDialogContent = (dc: DialogContent) => {
    this.setState({
      title: dc.title,
      childContentId: dc.contentId || null,
    });
  }

  render() {
    const { classes, onClose, onNavigateBack, children, ...others } = this.props;
    const { title, childContentId } = this.state;

    return (
      <MuiDialog
        aria-labelledby={this.dialogTitleId}
        aria-describedby={childContentId || this.dialogContentId}
        onClose={onClose}
        classes={{
          paper: classes.paper,
        }}
        maxWidth={false}
        {...others}
      >
        <ModalPaperHeader
          closeButton={!!onClose}
          onCloseClick={onClose}
          backButton={!!onNavigateBack}
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
