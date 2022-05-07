import { Typeahead } from "react-bootstrap-typeahead"
import { FormElement } from "../../types/form"
import { map } from "ramda";

import './Select.css';

export const Tag = ({ el }: { el: FormElement }) => {
  const { id, list, allowNew } = el;

  const newChecker = (results: Array<Object | string>, props: any) => {
    const selected = map<{ label: string }, string>(({ label }) => label)(props.selected);

    return selected.indexOf(props.text) < 0;
  }

  return <Typeahead
    id={id}
    multiple
    options={list}
    allowNew={allowNew ? newChecker : false}
  />
}