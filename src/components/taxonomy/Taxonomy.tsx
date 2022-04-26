import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { data, initForm, TaxonomyContext } from "./Context";
import { TaxonomyResults } from "./Results";
import { TaxonomyForm } from "./TaxonomyForm";

export function Taxonomy() {
  const update = (el: any) => (value: any) => {
    el.value = value;

    setState(typeof value == 'object' && !value.length
      ? { ...form, ...value }
      : { ...form, [el.id]: value });

    return null;
  }

  const [form, setState] = useState(initForm);

  return (
    <TaxonomyContext.Provider value={{ form, update }}>
      <Routes>
        <Route path="/" element={<Navigate to="/taxonomy/init" />}></Route>
        {data.map((item, i) => <Route key={`${item.id}_${i}`} path={item.path} element={
          <TaxonomyForm formData={item} />
        } />)}
        <Route path="/results" element={<TaxonomyResults />}></Route>
      </Routes>
    </TaxonomyContext.Provider>
  )
}