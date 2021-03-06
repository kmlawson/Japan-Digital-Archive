<?php

namespace JDA\CoreBundle\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\Controller;
use Symfony\Component\HttpFoundation\Response;

class AboutController extends Controller
{
    
    public function indexAction()
    {
    
    	$locale=$this->get('session')->getLocale();
    	
    	//If search query posted, redirect to search page and pass search query as url hash
    	
    	$request = $this->getRequest();
    	if($request->request->get('search-text')) return $this->redirect(sprintf('%s#%s', $this->generateUrl('search',array('_locale'=>$locale)), 'text='.$request->request->get('search-text')));
   
        return $this->render('JDACoreBundle:About:about.html.twig', array(
					// last displayname entered by the user
					'page'=> 'about',
					
				));
    	
    
    }
}
