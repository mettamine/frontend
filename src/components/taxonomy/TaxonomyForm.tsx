import { el } from 'date-fns/locale';
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { getElem } from '../form/Form';
import { TaxonomyContext } from './Context';
import { SearchTerms } from './SearchTerms';
import { Accounts } from './Accounts';

import './Taxonomy.css';

export function TaxonomyForm({ formData }: any) {
  const { form, update } = useContext(TaxonomyContext);
  const { title, data, redirect } = formData;

  return (
    <div className="tax-full">
      <div className="tax-title-line">
        <div className="tax-mid">{title}</div>
      </div>
      <div className="tax-mid">

        {data.map((el: any) => (
          el.id == 'search_terms'
            ? <SearchTerms key={el.id} formData={el}></SearchTerms>
              : el.id == 'accounts'
                ? <Accounts key={el.id} formData={el}></Accounts>
                : <div key={el.id}>
                    <div className="tax-label">{el.title} {el.required ? <span>*</span> : ''}</div>
                    {getElem(el, update(el))}
                    <div className="tax-line"></div>
                  </div>
        ))}
        <Link to={redirect}>
          <button>Next</button>
        </Link>
      </div>
    </div>
  );
}